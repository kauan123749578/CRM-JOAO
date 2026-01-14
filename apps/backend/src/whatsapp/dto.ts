export type SendMessageDto = {
  chatId: string;
  text: string;
  mediaUrl?: string;
  mediaType?: string;
};

export type UpdateChatTagsDto = {
  tags: string[];
};

export type UpdateChatStageDto = {
  stage: string;
};


