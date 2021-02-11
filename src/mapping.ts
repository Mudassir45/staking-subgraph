import { BigInt, BigDecimal,log} from "@graphprotocol/graph-ts"
import {
  Contract,
  CampaginAdded,
  OwnershipTransferred,
  Staked,
  TokensClaimed,
  Unstaked
} from "../generated/Contract/Contract"
import { User, Stake, Campain } from "../generated/schema"

export function handleStaked(event: Staked): void {
  let id = event.params.user.toHexString() + '-' + event.params.initialTimestamp.toHexString()
  let stake = Stake.load(id);

  if (!stake) {
    stake = new Stake(id);
    stake.amount = BigInt.fromI32(0)
  }
  stake.account = event.params.user;
  stake.amount = stake.amount.plus(event.params.amount);
  log.info("EVENT AMOUNT LOGGING,{}",[event.params.amount.toString()])
  stake.timestamp = event.params.initialTimestamp;
  stake.unstakeTimestamp = BigInt.fromI32(0);
  stake.earnedAmount = BigInt.fromI32(0);
  stake.campain = event.params.campaignTimestamp.toHex();

  let user = User.load(event.params.user.toHexString());
  
  if (!user) {
    user = new User(event.params.user.toHexString());
    user.stakes=[];
  }
  user.account = event.params.user;
  user.earned = BigInt.fromI32(0);

  let temp = user.stakes;
  temp.push(user.id);
  user.stakes = temp;
  user.totalStaked = user.totalStaked.plus(event.params.amount);

  user.save();
  stake.save();
}

export function handleCampaginAdded(event: CampaginAdded): void {
  let campain = Campain.load(event.params.startingTime.toHexString());
  if (campain == null) {
    campain = new Campain(event.params.startingTime.toHexString());
  }
  campain.startTimestamp = event.params.startingTime;
  campain.endTimestamp = event.params.endingTime;

  campain.save();
}

export function handleTokensClaimed(event: TokensClaimed): void {
  let unstake = Stake.load(event.params.user.toHex() + '-' + event.params.timestamp.toHex());
  
  unstake.earnedAmount = unstake.earnedAmount.plus(event.params.rewardAmount);

  let user = User.load(event.params.user.toHexString());
  user.earned = user.totalStaked.plus(event.params.rewardAmount);

  user.save();
  unstake.save();
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleUnstaked(event: Unstaked): void {
  let unstake = Stake.load(event.params.user.toHex() + '-' + event.params.initialTimestamp.toHex());
  
  unstake.timestamp = event.params.endingTimestamp;

  let user = User.load(event.params.user.toHexString());
  user.totalStaked = user.totalStaked.minus(event.params.amount);

  user.save();
  unstake.save();
}