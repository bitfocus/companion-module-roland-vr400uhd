const { InstanceStatus, TCPHelper } = require('@companion-module/base')

module.exports = {
	initTCP: function () {
		const self = this
		let databuffer = ''

		// init/cleanup
		if (self.socket) {
			self.socket.destroy()
			delete self.socket
		}
		self.config.port ??= 8023
		self.commandQueue = []
		self.draining = false

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
			databuffer += buffer.toString('utf8')

			// split into complete lines; keep any partial
			const lines = databuffer.split(/\r?\n/)
			databuffer = lines.pop() // remainder (possibly empty)

			for (const line of lines) {
				if (line.length) self.updateData(line)
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

		self.commandQueue.push(cmd)

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
			const cmd = self.commandQueue.shift()
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

		const lower = data.trim().toLowerCase()

		// authentication
		if (/\bpassword\b/i.test(data)) {
			self.updateStatus(InstanceStatus.UnknownWarning, 'Authenticating')
			self.log('info', 'Authentication requested. Sending password.')
			self.sendCommand(self.config.password)
			return
		}
		if (lower.includes('welcome')) {
			self.updateStatus(InstanceStatus.Ok)
			self.log('info', 'Authenticated.')
			self.getData() // seed queue
			this.drainQueue() // kick off send of first command
			self.startPolling()
			return
		}

		// ACK handling: ack,category,id,subId,value
		if (lower.startsWith('ack,')) {
			try {
				const parts = data.split(',')
				// parts[0] = 'ack'

				// send the next queued command
				if (typeof self._onAck === 'function') self._onAck()
			} catch (e) {
				self.log('error', 'Error parsing ack: ' + e)
				self.log('error', 'Data: ' + data)
			}
			return
		}

		// handle device errors
		if (data.trim() === 'ERR:0;') {
			// ...
			return
		}
		
		self.sendCommand(self.cmdQueue.shift()) // send the next command

		//do stuff with the data
		try {
			if (data.indexOf('ack') !== -1) {
				//acknowledgment received, send next command in queue
				

				//process the ack
				//acks look like this: ack,97,46,0,[a][lf ]
				//parts are ack, category, id, subId, value
				let parts = data.split(',')
			}
		} catch (error) {
			self.log('error', 'Error parsing incoming data: ' + error)
			self.log('error', 'Data: ' + data)
		}
	},
}
