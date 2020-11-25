package main

import (
	"context"
	"fmt"
	"os"

	_ "github.com/go-kivik/couchdb/v4" // The CouchDB driver
	kivik "github.com/go-kivik/kivik/v4"
)

func main() {

	client, err := kivik.New("couch", "http://localhost:5984/")
	if err != nil {
		panic(err)
	}
	db := client.DB("org1_wallet")

	// doc := map[string]interface{}{
	// 	"_id":      "cow",
	// 	"feet":     4,
	// 	"greeting": "moo",
	// }

	// rev, err := db.Put(context.TODO(), "cow2", doc)
	// if err != nil {
	// 	panic(err)
	// }
	// fmt.Printf("Cow inserted with revision %s\n", rev)

	file, _ := os.Open("/home/ubuntu/Downloads/sample.pdf")
	atts := &kivik.Attachment{
		Filename:    "sample.pdf",
		ContentType: "application/pdf",
		Stub:        true,
		Content:     file,
	}

	rev2, err2 := db.PutAttachment(
		context.TODO(),
		"cow",
		"3-55615cae5ae591948cc67e316d132b24",
		atts,
		nil)

	if err2 != nil {
		panic(err2)
	}
	fmt.Printf("Cow inserted with revision %s\n", rev2)
}
