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