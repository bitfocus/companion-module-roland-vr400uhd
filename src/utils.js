const { InstanceStatus, TCPHelper } = require('@companion-module/base')

module.exports = {
	initTCP: function () {
		let self = this
		let receivebuffer = ''

		if (self.socket !== undefined) {
			self.socket.destroy()
			delete self.socket
		}

		if (self.config.port === undefined) {
			self.config.port = 8023
		}

		if (self.config.host) {
			self.socket = new TCPHelper(self.config.host, self.config.port)

			let databuffer = ''

			self.socket.on('error', function (err) {
				self.log('error', 'Network error: ' + err.message)
				self.stopPolling()
				// Do not stay in OK status if device is off
				self.updateStatus(InstanceStatus.Connecting)
			})

			self.socket.on('connect', function () {
				self.updateStatus(InstanceStatus.Ok)
				self.log('info', 'Connected')
				self.getData() //get data once
				self.startPolling()
			})

			self.socket.on('data', function (buffer) {
				let indata = buffer.toString('utf8')

				databuffer += indata
				//if a newline is present, process the data and clear databuffer
				let newlineIndex = databuffer.indexOf('\n')
				if (newlineIndex !== -1) {
					//update feedbacks and variables
					self.updateData(databuffer)
					databuffer = ''
				}
			})
		}
	},

	startPolling() {
		let self = this
		self.log('debug', 'Start polling')
		self.pollTimer = setInterval(() => {
			self.getData()
		}, 10000)
	},

	stopPolling() {
		let self = this

		if (self.pollTimer !== undefined) {
			clearInterval(self.pollTimer)
			delete self.pollTimer
		}
	},

	getData() {
		let self = this
		self.addToQueue('get', 97, 46, 0) //pgm input
		self.addToQueue('get', 97, 46, 1) //pst input
	},

	addToQueue(type, category, id, subId, value) {
		let self = this

		let cmd = undefined

		if (type === 'set') {
			cmd = `set,${category},${id},${subId},${value}`
		} else if (type === 'get') {
			cmd = `get,${category},${id},${subId}`
		}

		if (self.config.verbose) {
			self.log('debug', 'Adding command to queue: ' + cmd)
		}
		
		self.commandQueue.push(cmd)
	},

	sendCommand: function (cmd) {
		let self = this

		if (cmd !== undefined) {
			if (self.socket !== undefined && self.socket.isConnected) {
				self.socket.send(cmd + '\n')
				if (self.config.verbose) {
					self.log('debug', 'Sent: ' + cmd)
				}

				//add to lastCommand
				self.lastCommand = cmd
			} else {
				self.log('error', 'Socket not connected')
			}
		}
	},

	updateData: function (data) {
		let self = this

		if (self.config.verbose) {
			self.log('debug', 'Received: ' + data)
		}

		if (data.trim().toLowerCase().indexOf('enter password') !== -1) {
			self.updateStatus(InstanceStatus.UnknownWarning, 'Authenticating')
			self.log('info', 'Authentication requested. Sending password.')
			self.sendCommand(self.config.password)
		} else if (data.trim().toLowerCase().indexOf('welcome to') !== -1) {
			self.updateStatus(InstanceStatus.Ok)
			self.log('info', 'Authenticated.')
		} else if (data.trim() == 'ERR:0;') {
			//an error with something that it received
		} else {
			//do stuff with the data
			try {
				if (data.indexOf('ack') !== -1) {
					//acknowledgment received, send next command in queue
					self.sendCommand(self.cmdQueue.shift())

					//process the ack
					//acks look like this: ack,97,46,0,[a][lf ]
					//parts are ack, category, id, subId, value
					let parts = data.split(',')
				}
			} catch (error) {
				self.log('error', 'Error parsing incoming data: ' + error)
				self.log('error', 'Data: ' + data)
			}
		}
	},
}
