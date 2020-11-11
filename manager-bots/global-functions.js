function __initConversation() { 
	var badLanguageOccurances = 0;
	var badLanguageThreshold = 3;
	botContext.setBotVariable('badLanguageOccurances', badLanguageOccurances, true, false);
	botContext.setBotVariable('badLanguageThreshold', badLanguageThreshold, true, false);
}

function processBadLanguage() {
	var badLanguageOccurances = parseInt(botContext.getBotVariable('badLanguageOccurances'));
	var badLanguageThreshold = parseInt(botContext.getBotVariable('badLanguageThreshold'));
	// Increment bad language occurance count
	badLanguageOccurances++;
	// Re-set bot occurance bot variable
	botContext.setBotVariable('badLanguageOccurances', badLanguageOccurances, true, false);
	// Direct to escalation interaction if threshold is reached
	if (badLanguageOccurances >= badLanguageThreshold) {
		botContext.setTriggerNextMessage('Escalate to agent');
	}
}