const argsParser = require('concierge/arguments'),
	emailValidator = require('email-validator'),
	nodeMailer = require('nodemailer'),
	twilio = require('twilio');

let mailTransport = null,
	twilioTransport = null;
	
const privateMessage = (api, user, message) => {
	api.sendPrivateMessage(message, user.id);
};

const textMessage = (phoneNumber, user, message) => {
	twilioTransport.sendMessage({
		to: phoneNumber,
		from: exports.config.smsConfig.phoneNumber,
		body: message
	}, (err, responseData) => {
		if (err) {
			throw new Error('Could not send the SMS.');
		}
	});
};

const seenChat = (api, event, user, message) => {
	
};

const respondChat = (api, event, user, message) => {
	exports.config.respond.push({
		id: user.id,
		thread: event.thread_id,
		name: user.name,
		from: event.sender_name,
		message: message
	});
};

const emailMessage = (event, email, user, message) => {
	mailTransport.sendMail({
		from: `"Concierge (pester)" <${exports.config.emailConfig.auth.user}>`,
		to: email,
		subject: 'Pester',
		html: `<h3>Pester</h3><p>This is a pester from <span style="color:red">${event.sender_name}</span> for <span style="color:cyan">${user.name}</span>.</p><hr /><p>${message}</p>`
	}, (error, info) => {
		if (error) {
			throw new Error('Email could not be sent.');
		}
	});
};

const onMessage = (api, event) => {
	for (let i = 0; i < exports.config.respond.length; i++) {
		const pester = exports.config.respond[i];
		if (event.thread_id === pester.thread && event.sender_id === pester.id) {
			exports.config.respond.splice(i, 1);
			i--;
			api.sendMessage(`@${pester.name}, @{pester.from} says: ${pester.message}`, event.thread_id);
		}
	}
};

const ensure = (name, def) => {
	if (!exports.config[name]) {
		exports.config[name] = def;
	}
};

exports.load = platform => {
	ensure('seen', []);
	ensure('respond', []);
	platform.on('message', onMessage);
	if (exports.config.emailConfig) {
		mailTransport = nodemailer.createTransport(exports.config.emailConfig);
	}
	else {
		LOG.warn('Email SMTP server has not been configured');
	}
	
	if (exports.config.smsConfig) {
		twilioTransport = twilio(exports.config.smsConfig.sid, exports.config.smsConfig.token);
	}
	else {
		LOG.warn('SMS settings have not been configured');
	}
};

exports.unload = platform => {
	platform.removeListener('message', onMessage);
};

exports.run = (api, event) => {
	const pesterQueue = [];
	const args = [
		{
			long: '--private',
			short: '-pm',
			description: 'Sends a private message to the person on this integration.',
			run: () => {
				pesterQueue.push(privateMessage.bind(this, api));
			}
		},
		{
			long: '--textmessage',
			short: '-tx',
			description: 'Sends a text message to the persons phone.',
			expects: ['PHONE_NUM'],
			run: (out, vals) => {
				if (!/^\+?[0-9]+$/.test(vals[0])) {
					throw new Error('Invalid phone number provided, please use international format (e.g. +64123456789)');
				}
				if (!exports.config.smsConfig) {
					throw new Error('Please configure your SMS settings (see https://twilio.github.io/twilio-node) and restart the module before continuing.');
				}
				pesterQueue.push(textMessage.bind(this, vals[0]));
			}
		},
		{
			long: '--seen',
			short: '-se',
			description: 'Sends a message to the persons the next time they are seen in this chat.',
			run: () => {
				if (event.event_source.indexOf('facebook') < 0) {
					throw new Error('Seen is currently only supported on facebook.');
				}
				pesterQueue.push(seenChat.bind(this, api, event));
			}
		},
		{
			long: '--respond',
			short: '-re',
			description: 'Sends a message to the persons the next time they send something in this chat.',
			run: () => {
				pesterQueue.push(respondChat.bind(this, api, event));
			}
		},
		{
			long: '--email',
			short: '-em',
			description: 'Sends a message to the persons the next time they send something in this chat.',
			expects: ['EMAIL'],
			run: (out, vals) => {
				if (!emailValidator.validate(vals[0])) {
					throw new Error('Invalid email address');
				}
				if (!exports.config.emailConfig) {
					throw new Error('Please configure your email settings (see https://nodemailer.com/) and restart the module before continuing.');
				}
				pesterQueue.push(emailMessage.bind(this, event, vals[0]));
			}
		}
	];
	
	try {
        const args = argsParser.parseArguments(event.arguments.slice(1), args, {
            enabled: true,
            string: `${api.commandPrefix}pester <name/id> <message...>`,
            colours: false
        });
    }
    catch (e) {
        return api.sendMessage(e.message, event.thread_id);
    }
		
	if (args.unassociated.length < 2) {
		return api.sendMessage('Both a name/id and a message must be provided.', event.thread_id);
	}
	
	const message = args.unassociated.slice(1).join(' ');
	if (args.parsed['-tx'] && message.length > 160) {
		return api.sendMessage('The maximum length of a text message is 160 characters. Please shorten your message.', event.thread_id);
	}
	
	const inputUser = args.unassociated[0].trim().toLowerCase();
	const users = api.getUsers(event.thread_id);
	const searchResults = Object.keys(users).filter(u => {
		const usr = users[u];
		const t = u.trim().toLowerCase();
		return t.startsWith(inputUser) || usr.name.trim().toLowerCase().startsWith(inputUser) || usr.id === inputUser;
	});
	
	if (searchResults.length > 0) {
		return api.sendMessage(`Don't know who you mean by "${args.unassociated[0]}":\n- ${searchResults.join('\n- ')}`, event.thread_id);
	}
	else if (searchResults === 0) {
		return api.sendMessage(`Ummmm, well... this is akward. Who is ${args.unassociated[0]}?`, event.thread_id);
	}
	
	api.sendMessage('Pester in progress...', event.thread_id);
	const user = users[0];
	for (let pester of pesterQueue) {
		pester(user, message);
	}
};