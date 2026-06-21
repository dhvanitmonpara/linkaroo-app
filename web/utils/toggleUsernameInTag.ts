const addUsernameInTag = (tag: string, username: string): string => {
  const addedUserTag = username + "/" + tag;
  return addedUserTag;
};

const removeUsernameTag = (
  tag: string,
  username?: string
): string | undefined => {
  if (username) return tag.replace(username + "/", "");
  const removedUserTag = tag.split("/").pop();
  return removedUserTag;
};

export { removeUsernameTag, addUsernameInTag };
