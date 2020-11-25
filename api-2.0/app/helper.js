'use strict';

var { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');

const util = require('util');

const nano = require('nano')('http://localhost:5984')
const nanodb = nano.use('org1_wallet');
 

const getCCP = async (org) => {
    let ccpPath;
    if (org == "Org1") {
        ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org1.json');

    } else if (org == "Org2") {
        ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org2.json');
    } else
        return null
    const ccpJSON = fs.readFileSync(ccpPath, 'utf8')
    const ccp = JSON.parse(ccpJSON);
    return ccp
}

const getCaUrl = async (org, ccp) => {
    let caURL;
    if (org == "Org1") {
        caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;

    } else if (org == "Org2") {
        caURL = ccp.certificateAuthorities['ca.org2.example.com'].url;
    } else
        return null
    return caURL

}

const getWalletPath = async (org) => {
    let walletPath;
    if (org == "Org1") {
        walletPath = path.join(process.cwd(), 'org1-wallet');

    } else if (org == "Org2") {
        walletPath = path.join(process.cwd(), 'org2-wallet');
    } else
        return null
    return walletPath

}


const getAffiliation = async (org) => {
    return org == "Org1" ? 'org1.department1' : 'org2.department1'
}

const checkForDB = async (walletName) =>{

    const wallet = await Wallets.newCouchDBWallet("http://localhost:5984/");

    try{
        const db = await wallet.store.db.server.db.get(walletName)

        if(!db){
           //console.log(wallet.store.db.server.db.create("wallet1db"))
           return true
       }
    }
     catch(error){
         return false
     }
}

const createDB = async (dbName) =>{
    const wallet = await Wallets.newCouchDBWallet("http://localhost:5984/");
    try{
        await wallet.store.db.server.db.create("dbName")
        return true
    }catch(error){
        return false
    }
}

const getRegisteredUser = async (username, userOrg, isJson,userData) => {
    let ccp = await getCCP(userOrg)

    const caURL = await getCaUrl(userOrg, ccp)
    const ca = new FabricCAServices(caURL);

    const walletPath = await getWalletPath(userOrg)
    const walletName = (userOrg+"_wallet").toLocaleLowerCase();
    let wallet; 

    if(checkForDB(walletName)){
        wallet = await Wallets.newCouchDBWallet("http://localhost:5984/",walletName);
    }else{
        const created = createDB(walletName);
        if(created){
            wallet = await Wallets.newCouchDBWallet("http://localhost:5984/",walletName);
        }else{
            var response = {
                success: false,
                message: 'Unable to Create Couch DB for this Org Name',
            };
            return response
        }
    }

   // wallet = await Wallets.newCouchDBWallet("http://localhost:5984/","org_users");
    console.log(`Wallet path: ${walletPath}`);

    // let input={
    //     test: 'test'
    // }

    // try{

    //     const u = await wallet.get(username)
    //     const user= {...u,...{test:'value'}}
    //     const res = await wallet.store.db.put(username,JSON.stringify(user));
    //     console.log(res)

    // }
    // catch(e){
    // console.log(e)
    //  }

    const userIdentity = await wallet.get(username);
    if (userIdentity) {
        console.log(`An identity for the user ${username} already exists in the wallet`);
        wallet.store.db.server
        var response = {
            success: true,
            message: username + ' enrolled Successfully',
        };
        return response
    }

    // Check to see if we've already enrolled the admin user.
    let adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
        console.log('An identity for the admin user "admin" does not exist in the wallet');
        await enrollAdmin(userOrg, ccp,walletName);
        adminIdentity = await wallet.get('admin');
        console.log("Admin Enrolled Successfully")
    }

    // build a user object for authenticating with the CA
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');
    let secret;
    try {
        // Register the user, enroll the user, and import the new identity into the wallet.
        secret = await ca.register({ affiliation: await getAffiliation(userOrg), enrollmentID: username, role: 'client' }, adminUser);
        // const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: username, role: 'client', attrs: [{ name: 'role', value: 'approver', ecert: true }] }, adminUser);

    } catch (error) {
        return error.message
    }


    const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret });
    // const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret, attr_reqs: [{ name: 'role', optional: false }] });

    let x509Identity;
    if (userOrg == "Org1") {
        x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
                test:'value',
            },
            mspId: 'Org1MSP',
            type: 'X.509',
            
        };
    } else if (userOrg == "Org2") {
        x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org2MSP',
            type: 'X.509',
        };
    }

    await wallet.put(username, x509Identity);
    console.log(`Successfully registered and enrolled admin user ${username} and imported it into the wallet`);

    let document;

    document = await nanodb.get(username)
    
    if(document){
        const updateResponse = await nanodb.insert({...document,...userData},username)
        if(updateResponse){
            var response = {
                success: true,
                message: username + ' enrolled Successfully',
            };
            return response
        }
        else{
            var response = {
                success: false,
                message: username + ' enrolled Successfully,but problem updating userData',
            };
            return response
        }
    }


}

const isUserRegistered = async  (username, password, userType, userOrg) => {
    // const walletPath = await getWalletPath(userOrg)
    // const walletName = (userOrg+"_wallet").toLocaleLowerCase();
    // const wallet = await Wallets.newCouchDBWallet("http://localhost:5984/",walletName);
    // console.log(`Wallet path: ${walletPath}`);

    // const userIdentity = await wallet.get(username);
    // if (userIdentity) {
    //     console.log(`An identity for the user ${username} exists in the wallet`);
    //     return true
    // }
    // return false
    try{
      const existingData = await getUserByUserName(username)
        if(existingData && (existingData.loginId === username && existingData.password === password && existingData.userType === userType)){
            var response = {
                success : true,
                 error   : null
             }
             return response;
        }else{
            var response = {
                success : false,
                 error   : 'Unauthorized'
             }
             return response;
        }

    }
    catch(error){
        console.log(error)
        var response = {
            success : false,
             error  : error
         }
        return response;
    }
    }

const getUserByUserName = async  (username) => {
    const dbName = "org1_wallet";
    const mangoQuery = {
    selector: {
        "loginId": {
            "$eq": username
          }
    }
    };

    let user = null;

    try{
        const search = await nanodb.find(mangoQuery)
        if(search.docs.length > 0){
            user = search.docs[0]
       }
      }catch(error){
          console.log(error)
    }
    return user;     
}

const getUserImage = async (username)=>{
    let response;
    try{
        const d = await nanodb.attachment.get(username, 'ProfilePic.png')
        var image = Buffer.from(d).toString('base64');
         response = {
            image : image,
            error : null
         }   
    }
    catch(error){
    console.log(error)
      response = {
        image : null,
        error :error
     } 
    }
	
    return response 
}


const uploadImageData = async  (walletName,username, data) => {
    var fileName = 'ProfilePic.png'
    const user = await getUserByUserName(username)
    if(user){
    try{
       const uploadStatus = await  nanodb.attachment.insert(user._id, fileName, Buffer.from(data, "base64"), 'image/png',
       { rev: user._rev })
       if(uploadStatus.ok){
        var response = {
            success : true,
             error  : null
         }
         return response;
    }else{
        var response = {
            success : false,
             error  : 'Unable to Update'
         }
         return response;
    }
    }
    catch(error){
        var response = {
            success : false,
             error  : error
         }
         return response
    }
}else{
    var response = {
        success : false,
         error  : 'No User Found to Update'
     }
     return response
}

}   


const uploadReportData = async  (walletName,username,data,fileName,fileType) => {
    const user = await getUserByUserName(username)
    if(user){
    try{
       const uploadStatus = await  nanodb.attachment.insert(user._id, fileName, Buffer.from(data, "base64"), fileType,
       { rev: user._rev })
       if(uploadStatus.ok){
        var response = {
            success : true,
             error  : null
         }
         return response;
    }else{
        var response = {
            success : false,
             error  : 'Unable to Update'
         }
         return response;
    }
    }
    catch(error){
        var response = {
            success : false,
             error  : error
         }
         return response
    }
}else{
    var response = {
        success : false,
         error  : 'No User Found to Update'
     }
     return response
}

}   




const getCaInfo = async (org, ccp) => {
    let caInfo
    if (org == "Org1") {
        caInfo = ccp.certificateAuthorities['ca.org1.example.com'];

    } else if (org == "Org2") {
        caInfo = ccp.certificateAuthorities['ca.org2.example.com'];
    } else
        return null
    return caInfo

}

const enrollAdmin = async (org, ccp,walletName) => {

    console.log('calling enroll Admin method')

    try {

        const caInfo = await getCaInfo(org, ccp) //ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = await getWalletPath(org) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newCouchDBWallet("http://localhost:5984/",walletName);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const identity = await wallet.get('admin');
        if (identity) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        let x509Identity;
        if (org == "Org1") {
            x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: 'Org1MSP',
                type: 'X.509',
            };
        } else if (org == "Org2") {
            x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: 'Org2MSP',
                type: 'X.509',
            };
        }

        await wallet.put('admin', x509Identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');
        return
    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
    }
}

exports.getRegisteredUser = getRegisteredUser

module.exports = {
    getCCP: getCCP,
    getWalletPath: getWalletPath,
    getRegisteredUser: getRegisteredUser,
    isUserRegistered: isUserRegistered,
    getUserByUserName: getUserByUserName,
    getUserImage: getUserImage,
    uploadReportData :uploadReportData,
    uploadImageData:uploadImageData,
}
