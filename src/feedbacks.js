const { combineRgb } = require('@companion-module/base')

module.exports = {
	initFeedbacks() {
		let self = this

		let feedbacks = {}

		feedbacks.currentPgmInput = {
			type: 'boolean',
			name: 'Current PGM Input',
			description: 'Indicates if the selected PGM input is currently active',
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: '0',
					choices: self.CHOICES_INPUTS,
				},
			],
			callback: (feedback) => {
				let options = feedback.options
				let input = options.input

				return self.DATA.pgmInput === input
			},
		}

		feedbacks.currentPstInput = {
			type: 'boolean',
			name: 'Current PST/PGM2 Input',
			description: 'Indicates if the selected PST input is currently active',
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: '0',
					choices: self.CHOICES_INPUTS,
				},
			],
			callback: (feedback) => {
				let options = feedback.options
				let input = options.input

				return self.DATA.pstInput === input
			},
		}

		this.setFeedbackDefinitions(feedbacks)
	},
}
