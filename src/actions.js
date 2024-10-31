module.exports = {
	initActions() {
		let self = this

		let actions = {}

		actions.select_pgm = {
			name: 'Select PGM Input',
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: '0',
					choices: self.CHOICES_INPUTS,
				},
			],
			callback: async (action) => {
				let options = action.options
				let input = options.input

				self.addToQueue('set', 97, 46, 0, input)
			},
		}

		actions.select_pst = {
			name: 'Select PST Input (PGM2 if in Dual Mode)',
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: '0',
					choices: self.CHOICES_INPUTS,
				},
			],
			callback: async (action) => {
				let options = action.options
				let input = options.input

				self.addToQueue('set', 97, 46, 1, input)
			},
		}

		actions.pressCut = {
			name: 'Press the [CUT] button',
			options: [],
			callback: async (action) => {
				self.addToQueue('set', 98, 43, 0, 1)
			},
		}

		actions.pressAuto = {
			name: 'Press the [AUTO] button',
			options: [],
			callback: async (action) => {
				self.addToQueue('set', 98, 42, 0, 1)
			},
		}

		actions.pressOutputFade = {
			name: 'Press the [OUTPUT FADE] button',
			options: [
				{
					type: 'dropdown',
					label: 'Selection',
					id: 'selection',
					default: '0',
					choices: [
						{ id: '0', label: '(PGM(DUAL Mode: PGM1))' },
						{ id: '1', label: '(DUAL Mode: PGM2)' },
					],
				},
				{
					type: 'dropdown',
					label: 'On/Off',
					id: 'onoff',
					default: '0',
					choices: [
						{ id: '0', label: 'Off' },
						{ id: '1', label: 'On' },
					],
				},
			],
			callback: async (action) => {
				let options = action.options
				let selection = options.selection
				let onoff = options.onoff

				self.addToQueue('set', 97, 25, selection, onoff)
			},
		}

		actions.dskOnOff = {
			name: 'Set DSK on/off',
			options: [
				{
					type: 'dropdown',
					label: 'On/Off',
					id: 'onoff',
					default: '0',
					choices: [
						{ id: '0', label: 'Off' },
						{ id: '1', label: 'On' },
					],
				},
			],
			callback: async (action) => {
				let options = action.options
				let onoff = options.onoff

				self.addToQueue('set', 97, 79, 0, onoff)
			},
		}

		actions.logoOnOff = {
			name: 'Set Logo on/off',
			options: [
				{
					type: 'dropdown',
					label: 'On/Off',
					id: 'onoff',
					default: '0',
					choices: [
						{ id: '0', label: 'Off' },
						{ id: '1', label: 'On' },
					],
				},
			],
			callback: async (action) => {
				let options = action.options
				let onoff = options.onoff

				self.addToQueue('set', 97, 63, 0, onoff)
			},
		}

		actions.mixWipeMode = {
			name: 'Set Mix/Wipe Mode',
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: 'mode',
					default: '0',
					choices: [
						{ id: '0', label: 'Mix' },
						{ id: '1', label: 'Wipe' },
					],
				},
			],
			callback: async (action) => {
				let options = action.options
				let mode = options.mode

				self.addToQueue('set', 97, 48, 0, mode)
			},
		}

		//change WIPE pattern
		actions.wipePattern = {
			name: 'Set Wipe Pattern',
			options: [
				{
					type: 'dropdown',
					label: 'Pattern',
					id: 'pattern',
					default: '0',
					choices: [
						{ id: '0', label: 'Pattern 1' },
						{ id: '1', label: 'Pattern 2' },
						{ id: '2', label: 'Pattern 3' },
						{ id: '3', label: 'Pattern 4' },
					],
				},
			],
			callback: async (action) => {
				let options = action.options
				let pattern = options.pattern

				self.addToQueue('set', 97, 49, 0, pattern)
			},
		}

		actions.transitionTime = {
			name: 'Set Transition Time',
			options: [
				{
					type: 'dropdown',
					label: 'Transition Time',
					id: 'time',
					default: self.CHOICES_TRANSITION_TIMES[0].id,
					choices: self.CHOICES_TRANSITION_TIMES,
				},
			],
			callback: async (action) => {
				let options = action.options
				let time = options.time

				self.addToQueue('set', 97, 18, 0, time)
			},
		}

		actions.autoTransitionOnOff = {
			name: 'Set Auto Transition on/off',
			options: [
				{
					type: 'dropdown',
					label: 'On/Off',
					id: 'onoff',
					default: '0',
					choices: [
						{ id: '0', label: 'Off' },
						{ id: '1', label: 'On' },
					],
				},
			],
			callback: async (action) => {
				let options = action.options
				let onoff = options.onoff

				self.addToQueue('set', 97, 19, 0, onoff)
			},
		}

		this.setActionDefinitions(actions)
	},
}
