require('dotenv').config();

const cont = require('./context');
const desafio = require('../app/utils/desafio');
const flow = require('../app/utils/flow');
const opt = require('../app/utils/options');
const prepApi = require('../app/utils/prep_api');
const { sendMain } = require('../app/utils/mainMenu');
const { checkAppointment } = require('../app/utils/consulta');
const research = require('../app/utils/research');
const { sentryError } = require('../app/utils/error');

jest.mock('../app/utils/flow');
jest.mock('../app/utils/error');
jest.mock('../app/utils/research');
jest.mock('../app/utils/options');
jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/checkQR');
jest.mock('../app/utils/mainMenu');
jest.mock('../app/utils/helper');
jest.mock('../app/utils/triagem');
jest.mock('../app/utils/consulta');

it('offerQuiz - user nunca começou quiz, oferece pela primeira vez', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.startedQuiz = false;
	await desafio.offerQuiz(context);

	await expect(context.state.startedQuiz === true).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.desafio.willStart, opt.answer.sendQuiz);
});

it('offerQuiz - user nunca começou quiz, oferece pela primeira vez e atualiza categoria do quiz', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.startedQuiz = false; const categoryQuestion = 'recrutamento';
	await desafio.offerQuiz(context, categoryQuestion);

	await expect(categoryQuestion).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ categoryQuestion });

	await expect(context.state.startedQuiz === true).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.desafio.willStart, opt.answer.sendQuiz);
});

it('offerQuiz - user já começou quiz, oferece de novo', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.startedQuiz = true;
	await desafio.offerQuiz(context);

	await expect(context.state.startedQuiz === true).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.desafio.started, opt.answer.sendQuiz);
});

it('Follow up - user estava no quiz publico_interesse, perguntamos se quer voltar ao quiz publico_interesse', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.categoryQuestion = 'publico_interesse'; context.state.goBackToQuiz = true; context.state.startedQuiz = true;
	await desafio.followUp(context);

	await expect(context.state.goBackToQuiz === true).toBeTruthy();
	await expect(context.state.startedQuiz === true).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.desafio.started, opt.answer.sendQuiz);
});

it('Follow up - user estava no quiz brincadeira, perguntamos se quer voltar ao quiz brincadeira', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.categoryQuestion = 'quiz_brincadeira'; context.state.goBackToQuiz = true; context.state.startedQuiz = true;
	await desafio.followUp(context);

	await expect(context.state.goBackToQuiz === true).toBeTruthy();
	await expect(context.state.startedQuiz === true).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.desafio.started, opt.answer.sendQuiz);
});

it('Follow up - user estava no quiz recrutamento, perguntamos se quer voltar ao quiz recrutamento', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.categoryQuestion = 'recrutamento'; context.state.goBackToQuiz = true; context.state.startedQuiz = true;
	await desafio.followUp(context);

	await expect(context.state.goBackToQuiz === true).toBeTruthy();
	await expect(context.state.startedQuiz === true).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.desafio.started, opt.answer.sendQuiz);
});

it('Follow up - user não acabou publico_interesse, perguntamos se quer terminar publico_interesse (menos de 3 vezes)', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.categoryQuestion = 'publico_interesse'; context.state.goBackToQuiz = false; context.state.startedQuiz = true;
	context.state.user = { is_target_audience: null }; context.state.currentCounter = { count_quiz: 0 };
	const type = 'publico-interesse'; const categoryQuestion = 'publico_interesse';
	await desafio.followUp(context, type, categoryQuestion);

	await expect(context.state.goBackToQuiz === true).toBeFalsy();
	await expect(context.state.user.is_target_audience === null).toBeTruthy();

	await expect(context.setState).toBeCalledWith({ currentCounter: await prepApi.getCount(context.session.user.id, type), currentCounterType: type });
	await expect(context.state.currentCounter && context.state.currentCounter.count_quiz >= 3).toBeFalsy();
	await expect(prepApi.postCount).toBeCalledWith(context.session.user.id, type);

	await expect(context.setState).toBeCalledWith({ categoryQuestion });
	await expect(context.sendText).toBeCalledWith(flow.desafio.started, opt.answer.sendQuiz);
});

it('Follow up - user não acabou publico_interesse, perguntamos mais de 3 vezes, vai pro menu', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.categoryQuestion = 'publico_interesse'; context.state.goBackToQuiz = false; context.state.startedQuiz = true;
	context.state.user = { is_target_audience: null }; context.state.currentCounter = { count_quiz: 3 };
	const type = 'publico-interesse'; const categoryQuestion = 'publico_interesse';
	await desafio.followUp(context, type, categoryQuestion);

	await expect(context.state.goBackToQuiz === true).toBeFalsy();
	await expect(context.state.user.is_target_audience === null).toBeTruthy();

	await expect(context.setState).toBeCalledWith({ currentCounter: await prepApi.getCount(context.session.user.id, type), currentCounterType: type });
	await expect(context.state.currentCounter && context.state.currentCounter.count_quiz >= 3).toBeTruthy();
	await expect(sendMain).toBeCalledWith(context);
});

it('Follow up - user não é publico_interesse e não acabou brincadeira, perguntamos se quer terminar brincadeira (menos de 3 vezes)', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.categoryQuestion = 'quiz_brincadeira'; context.state.goBackToQuiz = false; context.state.startedQuiz = true;
	context.state.user = { is_target_audience: 0 }; context.state.currentCounter = { count_quiz: 0 }; context.state.quizBrincadeiraEnd = false;
	const type = 'quiz-brincadeira'; const categoryQuestion = 'quiz_brincadeira';
	await desafio.followUp(context, type, categoryQuestion);

	await expect(context.state.goBackToQuiz === true).toBeFalsy();
	await expect(context.state.user.is_target_audience === 0).toBeTruthy();
	await expect(!context.state.quizBrincadeiraEnd).toBeTruthy();

	await expect(context.setState).toBeCalledWith({ currentCounter: await prepApi.getCount(context.session.user.id, type), currentCounterType: type });
	await expect(context.state.currentCounter && context.state.currentCounter.count_quiz >= 3).toBeFalsy();
	await expect(prepApi.postCount).toBeCalledWith(context.session.user.id, type);

	await expect(context.setState).toBeCalledWith({ categoryQuestion });
	await expect(context.sendText).toBeCalledWith(flow.desafio.started, opt.answer.sendQuiz);
});

it('Follow up - user não é publico_interesse e não acabou brincadeira, perguntamos mais de 3 vezes, vai pro menu', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.categoryQuestion = 'quiz_brincadeira'; context.state.goBackToQuiz = false; context.state.startedQuiz = true;
	context.state.user = { is_target_audience: 0 }; context.state.currentCounter = { count_quiz: 4 }; context.state.quizBrincadeiraEnd = false;
	const type = 'quiz-brincadeira'; const categoryQuestion = 'quiz_brincadeira';
	await desafio.followUp(context, type, categoryQuestion);

	await expect(context.state.goBackToQuiz === true).toBeFalsy();
	await expect(context.state.user.is_target_audience === 0).toBeTruthy();
	await expect(!context.state.quizBrincadeiraEnd).toBeTruthy();

	await expect(context.setState).toBeCalledWith({ currentCounter: await prepApi.getCount(context.session.user.id, type), currentCounterType: type });
	await expect(context.state.currentCounter && context.state.currentCounter.count_quiz >= 3).toBeTruthy();
	await expect(sendMain).toBeCalledWith(context);
});

it('Follow up - user não é publico_interesse e acabou brincadeira mas não assinou termos, perguntamos se quer assinar (menos de 3 vezes)', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.categoryQuestion = 'quiz_brincadeira'; context.state.goBackToQuiz = false; context.state.startedQuiz = true;
	context.state.user = { is_target_audience: 0 }; context.state.currentCounter = { count_quiz: 0 };
	context.state.quizBrincadeiraEnd = true; context.state.preCadastroSignature = false;
	const type = 'share';
	await desafio.followUp(context, type);

	await expect(context.state.user.is_target_audience === 0).toBeTruthy();
	await expect(!context.state.quizBrincadeiraEnd).toBeFalsy();
	await expect(!context.state.preCadastroSignature).toBeTruthy();

	await expect(context.setState).toBeCalledWith({ currentCounter: await prepApi.getCount(context.session.user.id, type), currentCounterType: type });
	await expect(context.state.currentCounter && context.state.currentCounter.count_quiz >= 3).toBeFalsy();
	await expect(prepApi.postCount).toBeCalledWith(context.session.user.id, type);

	await expect(research.TCLE).toBeCalledWith(context);
});

it('Follow up - user não é publico_interesse e acabou brincadeira mas não assinou termos, perguntamos mais de 3 vezes, vai pro menu', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.categoryQuestion = 'quiz_brincadeira'; context.state.goBackToQuiz = false; context.state.startedQuiz = true;
	context.state.user = { is_target_audience: 0 }; context.state.currentCounter = { count_quiz: 4 };
	context.state.quizBrincadeiraEnd = true; context.state.preCadastroSignature = false;
	const type = 'share';
	await desafio.followUp(context, type);

	await expect(context.state.user.is_target_audience === 0).toBeTruthy();
	await expect(!context.state.quizBrincadeiraEnd).toBeFalsy();
	await expect(!context.state.preCadastroSignature).toBeTruthy();

	await expect(context.setState).toBeCalledWith({ currentCounter: await prepApi.getCount(context.session.user.id, type), currentCounterType: type });
	await expect(context.state.currentCounter && context.state.currentCounter.count_quiz >= 3).toBeTruthy();
	await expect(sendMain).toBeCalledWith(context);
});

it('Follow up - user não é publico_interesse acabou brincadeira e assinou termos, vai pro menu', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.categoryQuestion = 'quiz_brincadeira'; context.state.goBackToQuiz = false; context.state.startedQuiz = true;
	context.state.user = { is_target_audience: 0 }; context.state.currentCounter = { count_quiz: 4 };
	context.state.quizBrincadeiraEnd = true; context.state.preCadastroSignature = true;
	await desafio.followUp(context);

	await expect(context.state.user.is_target_audience === 0).toBeTruthy();
	await expect(!context.state.quizBrincadeiraEnd).toBeFalsy();
	await expect(!context.state.preCadastroSignature).toBeFalsy();

	await expect(sendMain).toBeCalledWith(context);
});

it('Follow up - user é publico_interesse, não marcou consulta nem deixou contato, oferecemos pesquisa (menos de 3)', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.categoryQuestion = 'recrutamento'; context.state.goBackToQuiz = false; context.state.startedQuiz = true;
	context.state.user = { is_target_audience: 1 }; context.state.currentCounter = { count_quiz: 0 };
	context.state.temConsulta = null; const type = 'research-invite';
	await desafio.followUp(context, type);

	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ temConsulta: await checkAppointment(context) });
	await expect(!context.state.temConsulta && !context.state.leftContact).toBeTruthy();

	await expect(context.setState).toBeCalledWith({ currentCounter: await prepApi.getCount(context.session.user.id, type), currentCounterType: type });
	await expect(context.state.currentCounter && context.state.currentCounter.count_quiz >= 3).toBeFalsy();
	await expect(research.ofertaPesquisaStart).toBeCalledWith(context, flow.ofertaPesquisaStart.offer);
});

it('Follow up - user é publico_interesse, não marcou consulta nem deixou contato, oferecemos pesquisa mais de 3 vezes, vai pro menu', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.categoryQuestion = 'recrutamento'; context.state.goBackToQuiz = false; context.state.startedQuiz = true;
	context.state.user = { is_target_audience: 1 }; context.state.currentCounter = { count_quiz: 3 };
	context.state.temConsulta = false; const type = 'research-invite';
	await desafio.followUp(context, type);

	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ temConsulta: await checkAppointment(context) });
	await expect(!context.state.temConsulta && !context.state.leftContact).toBeTruthy();

	await expect(context.setState).toBeCalledWith({ currentCounter: await prepApi.getCount(context.session.user.id, type), currentCounterType: type });
	await expect(context.state.currentCounter && context.state.currentCounter.count_quiz >= 3).toBeTruthy();
	await expect(sendMain).toBeCalledWith(context);
});

it('Follow up - user é publico_interesse e de risco, já marcou consulta mas não acabou recrutamento, perguntamos se quer terminar recrutamento (menos de 3)', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.categoryQuestion = 'recrutamento'; context.state.goBackToQuiz = false; context.state.startedQuiz = true;
	context.state.user = { is_target_audience: 1, risk_group: 1 }; context.state.currentCounter = { count_quiz: 0 };
	context.state.temConsulta = true; context.state.recrutamentoEnd = false;
	const type = 'recrutamento'; const categoryQuestion = 'recrutamento';
	await desafio.followUp(context, type, categoryQuestion);

	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ temConsulta: await checkAppointment(context) });
	await expect(!context.state.temConsulta && !context.state.leftContact).toBeFalsy();
	await expect(!context.state.recrutamentoEnd && context.state.user.risk_group).toBeTruthy();

	await expect(context.setState).toBeCalledWith({ currentCounter: await prepApi.getCount(context.session.user.id, type), currentCounterType: type });
	await expect(context.state.currentCounter && context.state.currentCounter.count_quiz >= 3).toBeFalsy();
	await expect(prepApi.postCount).toBeCalledWith(context.session.user.id, type);

	await expect(context.setState).toBeCalledWith({ categoryQuestion });
	await expect(context.sendText).toBeCalledWith(flow.desafio.started, opt.answer.sendQuiz);
});

it('Follow up - user é publico_interesse e de risco, deixou contato mas não acabou recrutamento, perguntamos mais de 3 vezes, vai pro menu', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.categoryQuestion = 'recrutamento'; context.state.goBackToQuiz = false; context.state.startedQuiz = true;
	context.state.user = { is_target_audience: 1, risk_group: 1 }; context.state.currentCounter = { count_quiz: 3 };
	context.state.temConsulta = false; context.state.leftContact = true; context.state.recrutamentoEnd = false;
	const type = 'recrutamento'; const categoryQuestion = 'recrutamento';
	await desafio.followUp(context, type, categoryQuestion);

	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ temConsulta: await checkAppointment(context) });
	await expect(!context.state.temConsulta && !context.state.leftContact).toBeFalsy();
	await expect(!context.state.recrutamentoEnd && context.state.user.risk_group).toBeTruthy();

	await expect(context.setState).toBeCalledWith({ currentCounter: await prepApi.getCount(context.session.user.id, type), currentCounterType: type });
	await expect(context.state.currentCounter && context.state.currentCounter.count_quiz >= 3).toBeTruthy();
	await expect(sendMain).toBeCalledWith(context);
});

it('Follow up - user é publico_interesse mas não é de risco, deixou contato e assinou termos, não recebe recrutamento, vai pro menu', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.categoryQuestion = 'recrutamento'; context.state.goBackToQuiz = false; context.state.startedQuiz = true;
	context.state.user = { is_target_audience: 1, risk_group: 0 }; context.state.currentCounter = { count_quiz: 3 };
	context.state.temConsulta = false; context.state.leftContact = true; context.state.recrutamentoEnd = false;
	const type = 'recrutamento'; const categoryQuestion = 'recrutamento'; context.state.preCadastroSignature = true;
	await desafio.followUp(context, type, categoryQuestion);

	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ temConsulta: await checkAppointment(context) });
	await expect(!context.state.temConsulta && !context.state.leftContact).toBeFalsy();
	await expect(!context.state.recrutamentoEnd && context.state.user.risk_group).toBeFalsy();

	await expect(sendMain).toBeCalledWith(context);
});

it('Follow up - user é publico_interesse, marcou agendamento e terminou recrutamento, mas não assinou termos, perguntamos se quer assinar (menos de 3)', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.categoryQuestion = 'recrutamento'; context.state.goBackToQuiz = false; context.state.startedQuiz = true;
	context.state.user = { is_target_audience: 1 }; context.state.currentCounter = { count_quiz: 2 };
	context.state.temConsulta = true; context.state.recrutamentoEnd = true; context.state.preCadastroSignature = false;
	const type = 'share';
	await desafio.followUp(context, type);

	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(!context.state.temConsulta && !context.state.leftContact).toBeFalsy();
	await expect(!context.state.recrutamentoEnd).toBeFalsy();
	await expect(!context.state.preCadastroSignature).toBeTruthy();

	await expect(context.setState).toBeCalledWith({ currentCounter: await prepApi.getCount(context.session.user.id, type), currentCounterType: type });
	await expect(context.state.currentCounter && context.state.currentCounter.count_quiz >= 3).toBeFalsy();
	await expect(prepApi.postCount).toBeCalledWith(context.session.user.id, type);

	await expect(research.TCLE).toBeCalledWith(context);
});

it('Follow up - user é publico_interesse, marcou agendamento e terminou recrutamento, mas não assinou termos, perguntamos mais de 3 vezes, vai pro menu', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.categoryQuestion = 'recrutamento'; context.state.goBackToQuiz = false; context.state.startedQuiz = true;
	context.state.user = { is_target_audience: 1 }; context.state.currentCounter = { count_quiz: 5 };
	context.state.temConsulta = true; context.state.recrutamentoEnd = true; context.state.preCadastroSignature = false;
	const type = 'share';
	await desafio.followUp(context, type);

	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(!context.state.temConsulta && !context.state.leftContact).toBeFalsy();
	await expect(!context.state.recrutamentoEnd).toBeFalsy();
	await expect(!context.state.preCadastroSignature).toBeTruthy();

	await expect(context.setState).toBeCalledWith({ currentCounter: await prepApi.getCount(context.session.user.id, type), currentCounterType: type });
	await expect(context.state.currentCounter && context.state.currentCounter.count_quiz >= 3).toBeTruthy();
	await expect(sendMain).toBeCalledWith(context);
});

it('Follow up - user é publico_interesse, marcou agendamento, terminou recrutamento e assinou termos, vai pro menu', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.categoryQuestion = 'recrutamento'; context.state.goBackToQuiz = false; context.state.startedQuiz = true;
	context.state.user = { is_target_audience: 1 }; context.state.currentCounter = { count_quiz: 5 };
	context.state.temConsulta = true; context.state.recrutamentoEnd = true; context.state.preCadastroSignature = true;
	const type = 'share';
	await desafio.followUp(context, type);

	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(!context.state.temConsulta && !context.state.leftContact).toBeFalsy();
	await expect(!context.state.recrutamentoEnd).toBeFalsy();
	await expect(!context.state.preCadastroSignature).toBeFalsy();

	await expect(sendMain).toBeCalledWith(context);
});

it('Send Follow up - tipo de contator/followup desconhecido, avisa o erro internamente e manda usuário para o menu', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test'); const type = 'error'; context.state.currentCounter = { error: 'foobar' };
	await desafio.sendFollowUp(context, type);

	await expect(context.setState).toBeCalledWith({ currentCounter: await prepApi.getCount(context.session.user.id, type), currentCounterType: type });
	await expect(context.state.currentCounter && context.state.currentCounter.count_quiz >= 3).toBeFalsy();

	await expect(sentryError).toBeCalled();
	await expect(sendMain).toBeCalledWith(context);
});
