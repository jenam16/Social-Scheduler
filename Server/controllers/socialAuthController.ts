// Generate OAuth Authorization Url

// GET/api/auth/:platform

import {Request , Response} from "express";
import { User } from "../models/user.js";
import zernio from "../config/zernio.js";
import { Account } from "../models/account.js";


const getOrCreateZernioProfile = async (user:any) : Promise<string> =>{
    try{
const result = await zernio.profiles.listProfiles()
const data = result.data as any;
const profiles: any[] = Array.isArray(data) ? data:data?.profiles || data?.data || [];
   
 if(profiles.length > 0 ) {
    const pid = profiles[0]._id || profiles[0].id
    await User.findByIdAndUpdate(user._id , {zernioProfileId:pid})
    return pid;
 }

 const createResult = await zernio.profiles.createProfile({
    body : {name: `${user.name || user.email}'s workspace`} as any,
 })
 const created = (createResult.data as any)?.profile || createResult.data;

 const pid = created?._id || created?.id; 

 if(!pid){
    throw new Error("Failed to create zernio Profile - no ID returned")
 }
 await User.findByIdAndUpdate(user._id,{zernioProfileId:pid});
 return pid;
}
    catch(error : any){
 console.error("getOrcreateZernioProfile Error:", error?.message || error);
 throw error;
    }
} 

export const generateAuthUrl = async (req:Request,res:Response) : Promise<void>=>{
  try{
 const {platform} = req.params;
const profileId = await getOrCreateZernioProfile((req as any).user);
  const origin = req.headers.origin;
  const redirectUrl = `${origin}/accounts`;

  const result = await zernio.connect.getConnectUrl({
    path:{platform:platform as any},
    query:{
        profileId,
        redirect_url: redirectUrl
    }
  })
  const data = result.data as any ;
  console.log("getConnectUrl response:" , JSON.stringify(data,null,2))
  
  const authUrl = data.authUrl;
  if(!authUrl){
    throw new Error(`Zernio returned no authUrl . Full response: ${JSON.stringify(data)}`)
  }  
  res.json({url:authUrl})

} catch(error:any){
res.status(500).json({message:error?.message || "server error"})
  }
}


// sync connected accounts from zernio into mongodb 
//GET /api/auth/sync

export const syncAccounts = async (req:Request , res:Response) : Promise<void>=>{
    try{
        const profileId = await getOrCreateZernioProfile((req as any).user);
        const result = await zernio.accounts.listAccounts({
            query:{profileId} as any
        })
        const data = result.data as any;
        const zernioaccounts: any[] = data?.accounts || (Array.isArray(data) ? data:[]);
        const supportedPlatforms = ["twitter","linkedin", "facebook","instagram"];
        const syncedAccounts = [];

        for (const zAccount of zernioaccounts){
            const zid = zAccount._id || zAccount.id;
            if(!zid){
                console.warn("Skipping account with no ID: ",zAccount);
                continue;
            }
            const rawPlatform = (zAccount.platform || zAccount.tyoe || "").toLowerCase();
            const normalisedPlatform = supportedPlatforms.find((p)=>rawPlatform.includes(p));

            if(!normalisedPlatform){
                console.log(`Skipping unsupported platform:" ${rawPlatform}"`);
                continue;
            }
            const account = await Account.findOneAndUpdate(
                { zernioAccountId:zid},
                {
                    user:(req as any).user._id,
                    platform: normalisedPlatform,
                    handle:zAccount.username || zAccount.name || zAccount.handle || "Unknown",
                    zernioAccountId : zid,
                    status:"connected",
                    avatarUrl:zAccount.avatarUrl || zAccount.picture || zAccount.profile_image_url,


                },
                {upsert:true,returnDocument:'after'}
            )
            syncedAccounts.push(account)
        }
        res.json(syncedAccounts)
    } catch(error:any){
  res.status(500).json({message:error?.message || "Server error"});
    }
    
}