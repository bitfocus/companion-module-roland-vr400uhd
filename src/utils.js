const { InstanceStatus, TCPHelper } = require('@companion-module/base')

module.exports = {
	initTCP: function () {
		const self = this
		let dataReceived = ''

		self.loggedIn = false

		// init/cleanup
		if (self.socket) {
			self.socket.destroy()
			delete self.socket
		}
		self.config.port ??= 8023
		self.cmdQueue = []
		self.draining = false

		self.DATA = {
			pgmInput: null,
			pstInput: null,
		}

		if (!self.config.host) return

		self.socket = new TCPHelper(self.config.host, self.config.port)

		self.socket.on('error', (err) => {
			self.log('error', 'Network error: ' + err.message)
			self.stopPolling()
			self.updateStatus(InstanceStatus.Connecting)
		})

		self.socket.on('connect', () => {
			self.updateStatus(InstanceStatus.Ok)
			self.log('info', 'Connected')
		})

		self.socket.on('data', (buffer) => {
			let received = buffer.toString()

			if (self.loggedIn == false) {
				if (received.includes('Enter')) {
					if (self.passwordAsked) self.updateStatus(InstanceStatus.AuthenticationFailure, 'Wrong password')
					else {
						//Sending password
						self.passwordAsked = true
						setTimeout(() => {
							let pass = Buffer.from(self.config.password + '\n', 'latin1')
							if (self.socket.isConnected) self.socket.send(pass)
						}, 150)
					}
					dataReceived = ''
				} else if (received.includes('Welcome')) {
					self.updateStatus(InstanceStatus.Ok, 'Logged in successfully')
					self.log('info', 'Logged in successfully')
					self.loggedIn = true
					self.getData()
					self.drainQueue() // kick off send of first command
					self.startPolling()
					dataReceived = ''
				}
			} else {
				dataReceived += received
				//process the incoming data if we are logged in but only if we got a CR or LF
				if (dataReceived.includes('\r') || dataReceived.includes('\n')) {
					self.updateData(dataReceived)
					//clear
					dataReceived = ''
				}
			}
		})
	},

	startPolling() {
		const self = this
		const interval = Number(self.config.pollIntervalMs) || 1000
		self.log('debug', `Start polling @ ${interval}ms`)
		self.pollTimer = setInterval(() => self.getData(), interval)
	},

	stopPolling() {
		const self = this
		if (self.pollTimer) {
			clearInterval(self.pollTimer)
			delete self.pollTimer
		}
	},

	getData() {
		const self = this
		self.addToQueue('get', 97, 46, 0) // pgm input
		self.addToQueue('get', 97, 46, 1) // pst input
	},

	addToQueue(type, category, id, subId, value) {
		const self = this

		let cmd
		if (type === 'set') cmd = `set,${category},${id},${subId},${value}`
		else if (type === 'get') cmd = `get,${category},${id},${subId}`

		if (!cmd) return
		if (self.config.verbose) self.log('debug', 'Adding command to queue: ' + cmd)

		self.cmdQueue.push(cmd)

		// if nothing currently in-flight, start sending
		if (!self.draining && self.socket?.isConnected) {
			this.drainQueue()
		}
	},

	drainQueue() {
		const self = this
		if (self.draining) return
		self.draining = true

		const next = () => {
			const cmd = self.cmdQueue.shift()
			if (!cmd) {
				self.draining = false
				return
			}
			self.sendCommand(cmd)
			// Wait for an ack before sending the next; updateData() will call next()
			self._onAck = next
		}
		next()
	},

	sendCommand(cmd) {
		const self = this
		if (!cmd) return

		if (self.socket && self.socket.isConnected) {
			// CRLF to be safe
			self.socket.send(cmd + '\r\n')
			if (self.config.verbose) self.log('debug', 'Sent: ' + cmd)
			self.lastCommand = cmd
		} else {
			self.log('error', 'Socket not connected')
		}
	},

	updateData(data) {
		const self = this
		if (self.config.verbose) self.log('debug', 'Received: ' + data)

		try {
			//it is possible multiple commands may be processed, they will be separated by either a CR or LF, so split them into an array
			const commands = data.split(/[\r\n]+/)
			console.log('commands: ', commands)

			//loop through each command
			for (const cmd of commands) {
				console.log('processing: ' + cmd)
				// ACK handling: ack,category,id,subId,value
				if (cmd.startsWith('ack,')) {
					try {
						const parts = cmd.split(',')
						// parts[0] = 'ack'

						// send the next queued command
						if (typeof self._onAck === 'function') self._onAck()
					} catch (e) {
						self.log('error', 'Error parsing ack: ' + e)
						self.log('error', 'Data: ' + data)
					}
				}

				//if set
				if (cmd.startsWith('set,')) {
					try {
						const parts = cmd.split(',')
						// parts[0] = 'set'

						//if it is 97, 46, 0, pgm_input
						if (parts[1] === '97' && parts[2] === '46' && parts[3] === '0') {
							// process the pgm_input set command
							self.DATA.pgmInput = parseInt(parts[4])
							self.checkVariables()
						} else if (parts[1] === '97' && parts[2] === '46' && parts[3] === '1') {
							// process the pst_input set command
							self.DATA.pstInput = parseInt(parts[4])
							self.checkVariables()
						}
					} catch (e) {
						self.log('error', 'Error parsing set: ' + e)
						self.log('error', 'Data: ' + data)
					}
				}
			}

			// handle device errors
			if (data.trim() === 'err:0;') {
				// ...
				return
			}
		} catch (error) {
			self.log('error', 'Error parsing incoming data: ' + error)
			self.log('error', 'Data: ' + data)
		} finally {
			self.sendCommand(self.cmdQueue.shift()) // send the next command
		}
	},
}
