import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Token } from '../../interfaces/tokens/token.dto';

export type TokenListDocument = TokenList & Document;

@Schema()
export class TokenList {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  tokens: Token[];

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const TokenListSchema = SchemaFactory.createForClass(TokenList);
