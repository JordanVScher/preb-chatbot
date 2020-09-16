module.exports.regularMultipleChoice = {
	code: 'A1',
	count_more: 5,
	extra_quick_replies: null,
	has_more: 1,
	multiple_choices: { 1: 'Sim', 2: 'Não' },
	text: 'Você vai?',
	type: 'multiple_choice',
};

module.exports.extraMultiple = {
	code: 'AC5',
	count_more: 14,
	extra_quick_replies: [{ label: 'Não sei o que é', text: 'Tente descobrir' }],
	has_more: 1,
	multiple_choices: { 1: 'Sim', 2: 'Não' },
	text: 'Você vai?',
	type: 'multiple_choice',
};

module.exports.onHalfwayPoint = {
	code: 'AC8',
	count_more: 14,
	extra_quick_replies: [{ label: 'Não sei o que é', text: 'Tente descobrir' }],
	has_more: 1,
	multiple_choices: {
		1: 'Bora!', 2: 'Agora não',
	},
	text: 'Aceita participar?',
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
module.exports.finishedIsTarget = { finished_quiz: 1, id: 75, is_target_audience: 0 };
module.exports.finished = {
	finished_quiz: 1, id: 76, is_eligible_for_research: 1, is_part_of_research: 1, offline_pre_registration_form: 'foobar.com',
};
module.exports.finishedNotPart = {
	finished_quiz: 1, id: 76, is_target_audience: 0,
};
module.exports.halfway = {
	finished_quiz: 1, id: 76, is_target_audience: 0, followup_messages: ['image.png', 'foo', 'bar'],
};
module.exports.serverError = { error: 'Internal server error' };
module.exports.invalidValue = { form_error: { answer_value: 'invalid' } };
module.exports.handleAnswer = {	finished_quiz: 1, id: 76, is_eligible_for_research: 0 };
