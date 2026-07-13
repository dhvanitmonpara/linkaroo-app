package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	res, err := http.Get("http://localhost:8000/api/v1/links/all")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	body, _ := ioutil.ReadAll(res.Body)
	fmt.Println(string(body))
}
