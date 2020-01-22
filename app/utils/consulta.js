require('dotenv').config();

const flow = require('./flow');
const opt = require('./options');
const help = require('./helper');
const prepApi = require('./prep_api');
const checkQR = require('./checkQR');
const aux = require('./consulta-aux');
const { sendMain } = require('./mainMenu');
const { sentryError } = require('./error');


async function checkAppointment(context) {
	await context.setState({ consulta: await prepApi.getAppointment(context.session.user.id), cidade: context.state.user.city });
	if (context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0) {
		return true;
	}

	return false;
}

async function sendSalvador(context) {
	if (context.state.user && context.state.user.city && context.state.user.city.toString() === '2') { await context.sendText(flow.consulta.salvadorMsg); }
}

async function sendExtraMessages(context) {
	// await context.setState({ sendExtraMessages2: true });
	if (context.state.sendExtraMessages2 === true) {
		await context.setState({ sendExtraMessages2: false, sendExtraMessages: false });
		// console.log('offline_pre_registration_form', context.state.registrationForm);
		if (context.state.registrationForm && context.state.registrationForm.length > 0) {
			try {
				await context.sendButtonTemplate(flow.quizYes.text2, await checkQR.buildButton(context.state.registrationForm, 'Pré-Cadastro'));
			} catch (error) {
				await context.sendButtonTemplate(flow.quizYes.text2, await checkQR.buildButton('https://sisprep1519.org/api', 'Pré-Cadastro'));
				await sentryError('Consulta - Não foi possível enviar o form de registro', context.state);
			}
		}
	}
}

async function sendConsultas(context) {
		for (const iterator of context.state.consulta.appointments) { // eslint-disable-line
		const msg = await help.buildConsultaFinal(context.state, iterator);
		await context.sendText(msg);
	}

	if (context.state.voucher && context.state.voucher.length > 0) {
		await context.sendText(`Seu identificador: ${context.state.voucher}`);
	}
	await sendSalvador(context);
}

async function verConsulta(context) {
	if (context.state.user.is_target_audience === 1 || true) {
		await context.setState({ consulta: await prepApi.getAppointment(context.session.user.id), cidade: context.state.user.city });
		if (context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0) {
			await sendConsultas(context);
			await context.sendText(flow.consulta.view);
			await context.sendText(flow.mainMenu.text1, await checkQR.checkMainMenu(context));
		} else {
			await context.sendText(flow.verConsulta.zero, await checkQR.checkConsulta(context, opt.marcarConsulta));
		}
	} else {
		await sendMain(context);
	}
}

async function showDays(context) { // shows available days
	await context.setState({ cidade: context.state.user.city }); // getting location id
	// console.log('context.state.cidade', context.state.cidade, typeof context.state.cidade);
	await context.setState({ calendarCurrent: context.state.calendar[context.state.paginationDate], calendarNext: context.state.calendar[context.state.paginationDate + 1] });

	// console.log('Calendário current', context.state.calendarCurrent);
	// console.log('Calendário next', context.state.calendarNext);

	await context.setState({ freeDays: await aux.separateDaysQR(context.state.calendarCurrent, context.state.calendarNext, context.state.paginationDate) });
	// console.log('freeDays', JSON.stringify(context.state.freeDays, null, 2));

	if (context.state.freeDays && context.state.freeDays.length > 0) {
		await context.sendText(flow.consulta.date, { quick_replies: context.state.freeDays });
	} else {
		await context.sendText(flow.consulta.fail1, opt.consultaFail);
		await sentryError('Consulta - Não foi possível exibir os dias', context.state);
	}
}

async function showHours(context, ymd) {
	await context.setState({ chosenDay: context.state.calendarCurrent.find(date => date.ymd === ymd) }); // any day chosen from freeDays is in the calendarCurrent
	await context.setState({ freeHours: await aux.separateHoursQR(context.state.chosenDay.hours, ymd, context.state.paginationHour) });
	if (context.state.freeHours && context.state.freeHours.length > 0) {
		await context.sendText(flow.consulta.hours, { quick_replies: context.state.freeHours });
	} else {
		await context.sendText(flow.consulta.fail2, opt.consultaFail);
		await sentryError('Consulta - Não foi possível exibir as horas', context.state);
	}
}

async function finalDate(context, quota) { // where we actually schedule the consulta
	await context.setState({ paginationDate: 1, paginationHour: 1, dialog: '' }); // resetting pagination
	await context.setState({ chosenHour: context.state.chosenDay.hours.find(hour => hour.quota === parseInt(quota, 10)) });

	await context.setState({
		appointmentResponse: await prepApi.postAppointment(
			context.session.user.id, context.state.calendar.google_id, context.state.categoryConsulta || 'recrutamento',
			context.state.chosenDay.appointment_window_id, context.state.chosenHour.quota, context.state.chosenHour.datetime_start, context.state.chosenHour.datetime_end,
		),
	});

	if (context.state.appointmentResponse && context.state.appointmentResponse.id && !context.state.appointmentResponse.form_error) {
		const msg = `${flow.consulta.success}\n${await help.buildConsultaFinal(context.state, context.state.chosenHour)}`;
		await context.sendText(msg);
		await context.sendText(flow.consulta.view);
		await sendSalvador(context);
		await sendExtraMessages(context);

		if (context.state.nextDialog === 'ofertaPesquisaEnd') {
			await context.setState({ dialog: 'ofertaPesquisaEnd' });
		} else {
			await context.sendText(flow.mainMenu.text1, await checkQR.checkMainMenu(context));
		}
	} else {
		await context.sendText(flow.consulta.fail3, opt.consultaFail);
		console.log('context.state.appointmentResponse', context.state.appointmentResponse);
		await sentryError('Consulta - Não foi possível marcar a consulta', context.state);
	}
}

async function loadCalendar(context) { // consulta starts here
	if (context.state.user.is_target_audience === 1 || true) {
	/* load and prepare calendar */
		await context.setState({ paginationDate: 1, paginationHour: 1 }); // resetting pagination
		await context.setState({ calendar: await prepApi.getAvailableDates(context.session.user.id, context.state.user.city, context.state.paginationDate) }); // getting calendar
		await context.setState({ calendar: await context.state.calendar.dates.sort((obj1, obj2) => new Date(obj1.ymd) - new Date(obj2.ymd)) }); // order from closest date to fartest
		await context.setState({ calendar: await aux.cleanDates(context.state.calendar) });
		await context.setState({ calendar: await aux.separateDaysIntoPages(context.state.calendar) });

		if (context.state.sendExtraMessages === true) {
			// because of "outras datas" we cant show the extraMessages again, but we still have to show the next ones
			await context.setState({ sendExtraMessages2: true, sendExtraMessages: false });
			await context.sendText(flow.quizYes.text3.replace('<LOCAL>', help.extraMessageDictionary[context.state.user.city]));
			await context.sendText(flow.quizYes.text4);
			await context.setState({ sendExtraMessages: false });
		}

		await context.setState({ cidade: context.state.user.city });
		if (!context.state.cidade) {
			await sendMain(context);
		} else if (context.state.cidade.toString() === '3') { // ask location for SP
			await context.sendText(`O bate papo pode ser na ${await help.cidadeDictionary(context.state.cidade, '0')}`, opt.askTypeSP);
		} else {
			await context.sendText(`O bate papo pode ser no ${await help.cidadeDictionary(context.state.cidade)}`);
			await showDays(context);
		}
	} else {
		await sendMain(context);
	}
}

async function checarConsulta(context) {
	await context.setState({ consulta: await prepApi.getAppointment(context.session.user.id), cidade: context.state.user.city });
	if (context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0) {
		await context.sendText(flow.consulta.checar1);
		await sendConsultas(context);
		await context.sendText(flow.mainMenu.text1, await checkQR.checkMainMenu(context));
	} else {
		await loadCalendar(context);
	}
}

module.exports = {
	verConsulta,
	showDays,
	showHours,
	finalDate,
	checarConsulta,
	loadCalendar,
	checkAppointment,
};
