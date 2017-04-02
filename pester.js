const argsParser = require('concierge/arguments');

exports.run = (api, event) => {
	const args = [
		{
			long: '--private',
			short: '-pm',
			description: 'Sends a private message to the person on this integration.',
			run: out => {
				
			}
		},
		{
			long: '--textmessage',
			short: '-tx',
			description: 'Sends a text message to the persons phone.',
			run: out => {
				
			}
		},
		{
			long: '--seen',
			short: '-ws',
			description: 'Sends a message to the persons the next time they are seen in this chat.',
			run: out => {
				
			}
		},
		{
			long: '--respond',
			short: '-wr',
			description: 'Sends a message to the persons the next time they send something in this chat.',
			run: out => {
				
			}
		},
		{
			long: '--email',
			short: '-em',
			description: 'Sends a message to the persons the next time they send something in this chat.',
			run: out => {
				
			}
		}
	];
};