const NodeCouchDb = require('node-couchdb');
 
// node-couchdb instance with default options
const couch = new NodeCouchDb({
    host: 'localhost',
    protocol: 'http',
    port: 5984 
});


let document;



async function getData(){
 document = await couch.get("org1_wallet", "test1")
 console.log(document.data)

//updateData("org1_wallet",document.data._id,document.data._rev,document.data.data);
updateData("org1_wallet",document.data._id,document.data._rev,document.data);

}

//getData();
searchData("te");




async function updateData(databaseName,document_id,document_rev,data){

    const object= {userData:'test'}

    couch.update(databaseName, {...data,...object}).then(({data, headers, status}) => {
        console.log(data)
    }, err => {
        console.log(err)
    });
}

async function searchData(search){
const dbName = "org1_wallet";
const mangoQuery = {
    selector: {
        "loginId": {
            "$eq": search
          }
    }
};
const parameters = {};

couch.mango(dbName, mangoQuery, parameters).then(({data, headers, status}) => {
    // data is json response
    // headers is an object with all response headers
    // status is statusCode number
    console.log(data.docs[0])
}, err => {
    console.log(err)
    // either request error occured
    // ...or err.code=EDOCMISSING if document is missing
    // ...or err.code=EUNKNOWN if statusCode is unexpected
});
}

