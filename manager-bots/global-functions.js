function __initConversation() { 
	var badLanguageOccurrences = 0;
	var badLanguageThreshold = 3;
	botContext.setBotVariable('badLanguageOccurrences', badLanguageOccurrences, true, false);
	botContext.setBotVariable('badLanguageThreshold', badLanguageThreshold, true, false);
}

function processBadLanguage() {
	var badLanguageOccurrences = parseInt(botContext.getBotVariable('badLanguageOccurrences'));
	var badLanguageThreshold = parseInt(botContext.getBotVariable('badLanguageThreshold'));
	// Increment bad language occurrence count
	badLanguageOccurrences++;
	// Re-set bot occurrence bot variable
	botContext.setBotVariable('badLanguageOccurrences', badLanguageOccurrences, true, false);
	// Direct to escalation interaction if threshold is reached
	if (badLanguageOccurrences >= badLanguageThreshold) {
		botContext.setTriggerNextMessage('Escalate to agent');
	}
}

/* trail('<interaction name>'): 
sets a 'breacrumb' variable containing name of current interaction; example: - trail('button_question123');
Increments an 'error counter' for each unmatched phrase on current interaction, and reset upon moving to next interaction.
Adds each interaction to an array of previous interactions, which can then be used in the function 'previous();'
NOTE: Trail() function must be added to every 'question' interaction
*/
function trail(val) { 
	var e = getBotVar('intArr'); 
	if (e == 'null' || e == null) 
	{ e = []; } else { e = e.split(',');} e.push(val); setBotVar('intArr', e.toString()); txt(e.toString()); var count = Number(getBotVar('errorCounter')); var breadcrumb = getBotVar('breadcrumb'); if (breadcrumb != val) {count = 0;} setBotVar('errorCounter', count); setBotVar('breadcrumb', val); };

/* previous 
Used in conjunction with the 'trail()' function.
Goes to previous interaction in the 'interactionArray' and pops the last interaction name.
*/
var previous = function () {var e = getBotVar('intArr').split(",");if(e.length === 1){txt('You are already back to the start');}e.pop();  setBotVar('intArr', e);jumpTo(e.pop());};
