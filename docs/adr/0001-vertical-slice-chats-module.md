# Vertical Slice In The Chats Module

We split the chats module into case-oriented providers (`list-chats`, `start-chat`, `send-message`, `list-chat-messages`) and kept `ChatsService` as a thin facade. This is harder to reverse than a simple file move, future readers would not infer on their own why a Nest service delegates instead of owning the logic, and we chose it deliberately over controller-level injection to preserve the module contract while making each chat flow independently maintainable.
