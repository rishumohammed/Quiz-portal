export default (io, socket) => {
  // Join a conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conv-${conversationId}`);
    console.log(`User ${socket.user.email} joined conversation ${conversationId}`);
  });

  // Leave a conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conv-${conversationId}`);
    console.log(`User ${socket.user.email} left conversation ${conversationId}`);
  });

  // New message event is usually handled by the REST API, 
  // which then emits a 'new_message' event to the room via getIO().
  // However, we can also handle direct emits if needed.
};
