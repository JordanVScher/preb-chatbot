module.exports.regularMultipleChoice = {
	code: 'A1',
	count_more: 5,
	extra_quick_replies: null,
	has_more: 1,
	multiple_choices: { 1: 'Sim', 2: 'Não' },
	text:
        'Você vai?',
	type: 'multiple_choice',
};

module.exports.extraMultiple = {
	code: 'AC5',
	count_more: 14,
	extra_quick_replies: [{ label: 'Não sei o que é', text: 'Tente descobrir' }],
	has_more: 1,
	multiple_choices: {
		1: 'Sempre!', 2: 'Às vezes', 3: 'Já fui', 4: 'Nunca!',
	},
	text: 'Você vai?',
	type: 'multiple_choice',
};

module.exports.regularOpenText = {
	code: 'B2',
	count_more: 10,
	extra_quick_replies: null,
	has_more: 1,
	multiple_choices: null,
	text:
        'Você vai?',
	type: 'open_text',
};

module.exports.nullQuestion = {
	code: null,
	count_more: 0,
	extra_quick_replies: null,
	has_more: null,
};


module.exports.notFinished = { finished_quiz: 0, id: 75 };
module.exports.finished = {
	finished_quiz: 1, id: 76, is_eligible_for_research: 1,	is_part_of_research: 1,
};
module.exports.serverError = { error: 'Internal server error' };
module.exports.invalidValue = { form_error: { answer_value: 'invalid' } };
module.exports.handleAnswer = {	finished_quiz: 1, id: 76, is_eligible_for_research: 0 };
