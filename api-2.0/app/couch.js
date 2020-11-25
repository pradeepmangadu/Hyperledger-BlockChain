const nano = require('nano')('http://localhost:5984')
const db = nano.use('org1_wallet');
const fs = require('fs');
db.attachment.get('new', 'ima.jpg').then((body) => {
    console.log(body)
    const buf = Buffer.from(body);
    console.log(buf.toString('base64'));
  });

// db.get('new').then((body) => {
//     console.log(body);
//     const object= {userData:'test'}

//   db.insert({...body,...object}, 'new').then((body) => {
//         console.log(body);
//       });


//       const mangoQuery = {
//             selector: {
//                 "loginId": {
//                     "$eq": 'new'
//                   }
//             }
//         };
//       db.find(mangoQuery).then((doc) => {
//         console.log(doc);
//       });
//   });




















// const NodeCouchDb = require('node-couchdb');
 
// // node-couchdb instance with default options
// const couch = new NodeCouchDb({
//     host: 'localhost',
//     protocol: 'http',
//     port: 5984 
// });


// let document;



// async function getData(){
//  document = await couch.get("org1_wallet", "test1")
//  console.log(document.data)

// //updateData("org1_wallet",document.data._id,document.data._rev,document.data.data);
// updateData("org1_wallet",document.data._id,document.data._rev,document.data);

// }

// //getData();
// //searchData("te");
// //upload()

// couch.del("org1_wallet", "tom", "11-ff9d32c47e6cf55e2d439bd38c7c78f4").then(({data, headers, status}) => {
//     // data is json response
//     // headers is an object with all response headers
//     // status is statusCode number
//     console.log(data)
// }, err => {
//     // either request error occured
//     // ...or err.code=EDOCMISSING if document does not exist
//     // ...or err.code=EUNKNOWN if response status code is unexpected
//     console.log(err)
// });




// async function updateData(databaseName,document_id,document_rev,data){

//     const object= {userData:'test'}

//     couch.update(databaseName, {...data,...object}).then(({data, headers, status}) => {
//         console.log(data)
//     }, err => {
//         console.log(err)
//     });
// }

// async function searchData(search){
// const dbName = "org1_wallet";
// const mangoQuery = {
//     selector: {
//         "loginId": {
//             "$eq": search
//           }
//     }
// };
// const parameters = {};

// couch.mango(dbName, mangoQuery, parameters).then(({data, headers, status}) => {
//     // data is json response
//     // headers is an object with all response headers
//     // status is statusCode number
//     console.log(data.docs[0])
// }, err => {
//     console.log(err)
//     // either request error occured
//     // ...or err.code=EDOCMISSING if document is missing
//     // ...or err.code=EUNKNOWN if statusCode is unexpected
// });
// }



// async function upload (){
//     couch.insertAttachment("org1_wallet", "test", "image", {}, "3-666d133ce97577feaaacee5d4e94f50a").then(({data, headers, status}) => {
//         // data is json response
//         // headers is an object with all response headers
//         // status is statusCode number
//         console.log(data)
//     }, err => {
//         // either request error occured
//         // ...or err.code=EFIELDMISSING if either _id or _rev fields are missing
//         console.log(err)
//     });
// }

