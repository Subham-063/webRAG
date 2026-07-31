const conversationHistory = [];

export function addMessage(
    role,
    content
) {

    conversationHistory.push({

        role,
        content,
    });

    if (
        conversationHistory.length > 10
    ) {

        conversationHistory.shift();
    }
}

export function getHistory() {

    return conversationHistory;
}