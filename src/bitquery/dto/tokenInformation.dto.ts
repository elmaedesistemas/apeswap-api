import { PairInformationDto, QuoteTokenDto } from './pairInformation.dto';

export class TokenInformationDto {
  name?: string;
  symbol?: string;
  address?: string;
  tokenPrice?: number;
  totalSupply?: number;
  burntAmount?: number;
  circulatingSupply?: number;
  marketCap?: number;
  quote?: QuoteTokenDto;
}

export class TokenLPInformationDto {
  address?: string;
  lp?: PairInformationDto[];
}