## Pester
Pesters someone to get their attention.

#### Installation
```shell
/kpm install pester
```

#### Configuration
```shell
/kpm config pester emailConfig <nodemailer config>
/kpm config pester smsConfig {"phoneNumber":"<twilioPhoneNumber>", "sid":"<twilioSID>", "token":"<twilioToken>"}
```

See [https://twilio.github.io/twilio-node](https://twilio.github.io/twilio-node) and [https://nodemailer.com/](https://nodemailer.com/).

#### Usage
```shell
USAGE
	/pester [name/id] [message...] <options...>
OPTIONS
	-pm, --private
		Sends a private message to the person on this integration.
	-tx, --textmessage {PHONE_NUM} 
		Sends a text message to the persons phone.
	-se, --seen
		Sends a message to the persons the next time they are seen in this chat.
	-re, --respond
		Sends a message to the persons the next time they send something in this chat.
	-em, --email {EMAIL} 
		Sends a message to the persons the next time they send something in this chat.
	-h, --help
		Shows this help.
```

#### License
Licensed under the MIT license. Copyright (c) 2017 Matthew Knox.
