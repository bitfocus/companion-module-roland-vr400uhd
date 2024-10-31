const constants = require('./constants')

module.exports = {
	initVariables() {
		let self = this

		let variables = []

		variables.push({ variableId: 'pgm_input', name: 'Current PGM Input' })
		variables.push({ variableId: 'pst_input', name: 'Current PST Input' })

		self.setVariableDefinitions(variables)
	},

	checkVariables() {
		let self = this

		try {
			let variableObj = {}

			let currentPgm = self.DATA.pgmInput
			//find the value in CHOICES_INPUTS that matches the currentPgm value
			let pgmInput = self.CHOICES_INPUTS.find((input) => input.id === currentPgm)?.label || 'Unknown'
			variableObj['pgm_input'] = pgmInput

			let currentPst = self.DATA.pstInput
			//find the value in CHOICES_INPUTS that matches the currentPst value
			let pstInput = self.CHOICES_INPUTS.find((input) => input.id === currentPst)?.label || 'Unknown'
			variableObj['pst_input'] = pstInput

			self.setVariableValues(variableObj)
		} catch (error) {
			self.log('error', `Error checking variables: ${error.toString()}`)
		}
	},
}
