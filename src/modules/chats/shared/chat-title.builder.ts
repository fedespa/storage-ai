import { MAXIMUM_GENERATED_TITLE_LENGTH } from './chat.constants';

export function buildChatTitleFromFirstMessage(firstMessage: string): string {
  const normalizedMessage = firstMessage.replace(/\s+/g, ' ').trim();

  if (normalizedMessage.length <= MAXIMUM_GENERATED_TITLE_LENGTH) {
    return normalizedMessage;
  }

  return `${normalizedMessage
    .slice(0, MAXIMUM_GENERATED_TITLE_LENGTH - 3)
    .trim()}...`;
}
