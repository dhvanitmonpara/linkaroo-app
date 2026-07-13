package main

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	// First fetch all links
	res, _ := http.Get("http://localhost:8000/api/v1/links/all")
	body, _ := ioutil.ReadAll(res.Body)
	fmt.Println("GET /links/all:")
	fmt.Println(string(body))

	// Then try to patch a link with a tag
	// (We'll just use a dummy tag payload that simulates what the frontend sends)
	payload := []byte(`{"tags":[{"_id":"2f5ca9ca-5fc1-4aa4-b05b-abef13f448e8","tagname":"hiidhiwe"}]}`)
	
	req, _ := http.NewRequest("PATCH", "http://localhost:8000/api/v1/links/85b8a7bb-c733-4a0e-b153-2d3e53e61ea2", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{}
	patchRes, err := client.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	
	patchBody, _ := ioutil.ReadAll(patchRes.Body)
	fmt.Println("PATCH response:")
	fmt.Println(string(patchBody))
}
