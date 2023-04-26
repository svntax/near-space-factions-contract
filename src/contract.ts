import { NearBindgen, near, call, view, Vector, LookupMap } from 'near-sdk-js';
import { Support } from './model';

@NearBindgen({})
export class SpaceFactions {
  squareSupporters: number = 0;
  circleSupporters: number = 0;
  triangleSupporters: number = 0;

  userSupportersData: LookupMap<Support> = new LookupMap<Support>("u");

  messagesStart: Vector<String> = new Vector<String>("s");
  messagesStartIndex: number = 0;

  @view({})
  get_supporters_square(): number {
    return this.squareSupporters;
  }

  @view({})
  get_supporters_circle(): number {
    return this.circleSupporters;
  }

  @view({})
  get_supporters_triangle(): number {
    return this.triangleSupporters;
  }

  @view({})
  get_supporters_data(): Array<number> {
    return [this.squareSupporters, this.circleSupporters, this.triangleSupporters];
  }

  @view({})
  get_messages_start(): Array<String> {
    return this.messagesStart.toArray();
  }

  @view({})
  get_user_support_data({ account }: { account: string }): Support {
    if(this.userSupportersData.containsKey(account)){
        let supportObject = this.userSupportersData.get(account);
        if(supportObject){
            return {
                account_id: account,
                support_square: supportObject.support_square,
                support_circle: supportObject.support_circle,
                support_triangle: supportObject.support_triangle
            };
        }
    }
    else{
        return {
            account_id: account,
            support_square: 0,
            support_circle: 0,
            support_triangle: 0
        };
    }
  }

  @call({})
  add_support({ support, faction }: { support: number, faction: number }): void {
    let user_id = near.signerAccountId();
    if(faction < 1 || faction > 3){
        near.log(`Invalid faction ID ${faction}`);
    }
    else{
        if(support > 0 && support <= 1000){
            near.log(`${user_id} sent support ${support} for faction ${faction}`);

            let supportObject = this.userSupportersData.get(user_id);
            let updatedSupportObject = {
                account_id: user_id,
                support_square: 0,
                support_circle: 0,
                support_triangle: 0
            };
            if(supportObject){
                updatedSupportObject = {
                    account_id: user_id,
                    support_square: supportObject.support_square,
                    support_circle: supportObject.support_circle,
                    support_triangle: supportObject.support_triangle
                }
            }

            if(faction === 1){
                this.squareSupporters += support;

                updatedSupportObject.support_square += support;
                this.userSupportersData.set(user_id, updatedSupportObject);
            }
            else if(faction === 2){
                this.circleSupporters += support;

                updatedSupportObject.support_circle += support;
                this.userSupportersData.set(user_id, updatedSupportObject);
            }
            if(faction === 3){
                this.triangleSupporters += support;

                updatedSupportObject.support_triangle += support;
                this.userSupportersData.set(user_id, updatedSupportObject);
            }
        }
        else{
            near.log(`${user_id} sent an invalid support amount: ${support}`);
        }
    }
  }

  @call({})
  add_message_start({ message }: { message: String }): void {
    let account_id = near.signerAccountId();
    near.log(`${account_id} added message ${message}`);
    if(this.messagesStart.length < 20){
        this.messagesStart.push(message);
    }
    else{
        this.messagesStart.replace(this.messagesStartIndex, message);
        this.messagesStartIndex++;
        if(this.messagesStartIndex >= this.messagesStart.length){
            this.messagesStartIndex = 0;
        }
    }
  }
}