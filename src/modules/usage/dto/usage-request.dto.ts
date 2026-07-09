import { IsEmpty } from 'class-validator';

export class UsageRequestDto {
  @IsEmpty()
  public userId?: never;
}
