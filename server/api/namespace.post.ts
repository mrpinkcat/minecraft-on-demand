export default defineEventHandler(async (event) => {
  if (event.context.user?.namespace) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Your namespace already exist',
    });
  }

  // setHeader(event, 'cache-control', 'no-cache');
  // setHeader(event, 'connection', 'keep-alive');
  // setHeader(event, 'content-type', 'text/event-stream');
  // setResponseStatus(event, 200);

  const eventStream = createEventStream(event);

  eventStream.push({
    data: 'Creating namespace...',
  });

  await new Promise((resolve) => setTimeout(resolve, 4000));

  const namespace = await k8sApi.createNamespace({
    body: {
      metadata: {
        name: `${event.context.auth.id}-${event.context.auth.username}`,
      },
    },
  });

  const namespaceName = namespace.metadata?.name;
  if (!namespaceName) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create namespace',
    });
  }

  eventStream.push({
    data: 'Linking namespace to user...',
  });

  await new Promise((resolve) => setTimeout(resolve, 4000));

  await prisma.user.update({
    where: {
      id: event.context.auth.id,
    },
    data: {
      namespace: namespaceName,
    },
  });

  eventStream.push({
    data: `Namespace ${namespaceName} created and linked to user.`,
  });

  await new Promise((resolve) => setTimeout(resolve, 4000));

  eventStream.close();

  return eventStream.send();
});
