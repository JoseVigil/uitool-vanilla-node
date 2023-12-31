    exports.createUser = functions.https.onRequest( async (req, res) => {

            const key = req.headers.authorization.split('Bearer ')[1];
            
            if (key!="5lb6QqmXFkUpzNjHvkVqv0xXfTz6rNoRfmhqMuzKxw1b1YlWuF") {
                res.status(403).send('Unauthorized');
            } else {

                res.set("Access-Control-Allow-Origin", "*");
                res.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
                res.set('Access-Control-Allow-Headers', '*');    

                if (req.method === 'OPTIONS') {
                    res.end();
                } else {

                    var email = req.body.email; 
                    var name = req.body.name;
                    var surname = req.body.surname;
                    var phone = req.body.phone;

                    async function generatePassword (len) {
                        var pwd = [], cc = String.fromCharCode, R = Math.random, rnd, i;
                        pwd.push(cc(48+(0|R()*10))); 
                        pwd.push(cc(65+(0|R()*26))); 
                    
                        for(i=2; i<len; i++){
                        rnd = 0|R()*62; 
                        pwd.push(cc(48+rnd+(rnd>9?7:0)+(rnd>35?6:0)));
                        }
                        return pwd.sort(function(){ return R() - .5; }).join('');
                    }

                    let pass = await generatePassword(15);
                    let displayName = name + " " +  surname;

                    var newUser = {
                        email: email,
                        emailVerified: true,
                        password: pass,
                        displayName: displayName,
                        phoneNumber: "+549" + phone,
                        disabled: false,
                    };

                    let createUserPromise = await new Promise( async (resolve, reject) => {

                        var userRecord, userId;

                        try {                   

                            console.log("-----------------------");
                            console.log(newUser);
                            console.log("-----------------------");

                            userRecord = await admin.auth().createUser(newUser);
                            

                        } catch (error) {
                            console.log("error failed to create a user: "+ error);
                            throw new functions.https.HttpsError('failed to create a user');
                        }

                        try {

                            console.log("-----------------------");
                            //console.log("userRecord.hub_vid: " + userRecord.hub_vid);
                            
                            userId = userRecord.uid;                
                            
                            console.log("userId: " + userId);
                            console.log("-----------------------");

                            let claim = {};
                            if(admins.indexOf( email ) !== -1) {
                                claim = { isAdmin: true }; 
                            } else {
                                claim = { isUser: true };
                            }

                            await admin.auth().setCustomUserClaims(userId, claim);

                            //https://www.toptal.com/firebase/role-based-firebase-authentication
                            //https://medium.com/firebase-tips-tricks/how-to-create-an-admin-module-for-managing-users-access-and-roles-34a94cf31a6e

                            resolve({user:userRecord});

                        } catch (error) {
                            console.log("error: "+ error);
                            throw new functions.https.HttpsError('failed to set Custom User Claims');
                        }                    

                    });

                    console.log("-----------------------");   
                    console.log("createUserPromise: " + JSON.stringify(createUserPromise));
                    console.log("-----------------------");

                    let name_label = newUser.displayName.split(' ').join('_').toLowerCase();
                    let uid = createUserPromise.user.uid;

                    let account_data = {
                        uid:uid,
                        name:newUser.displayName,
                        name_label:name_label,
                        email:newUser.email,
                        password:newUser.password
                    };

                    console.log("-----------------------");   
                    console.log("account_data: " + JSON.stringify(account_data));
                    console.log("-----------------------");

                    await firestore.collection("accounts").doc(uid).set(account_data, {merge:true})
                    .then( (document) => { 

                        return res.status(200).send(account_data); 

                    });
                    
                    
                }
            }        
    })
