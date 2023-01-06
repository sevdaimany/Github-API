const form = document.getElementById('form');
const API_URL = "https://api.github.com/users/";

// This function reset the form for the next request.
function reset(){
    const photo = document.querySelector("#photo");
    const name = document.querySelector("#name");
    const blog = document.querySelector("#blog");
    const location = document.querySelector("#location");
    const bio = document.querySelector("#bio");
    const errorlabel = document.querySelector("#error");
    const language = document.querySelector("#language");

    name.innerText = "";
    blog.innerText = "";
    location.innerText = "";
    bio.innerText = "";
    photo.setAttribute("src", '');
    errorlabel.innerText = "";
    language.innerText = "";
}

// this function is called when the username is not found; and display the error for it.
function notfound(){
    const errorlabel = document.querySelector("#error");
    errorlabel.innerText = "User not found.";
}

// this function finds the key with higher value from the languages dictionary.
function find_most_frequent_lang(languages){
    let max = 0;
    let key = "";
    for (let lan in languages){
        if (languages[lan] > max){
            max = languages[lan];
            key = lan;
        }
    }
    return key;
}

// this function finds the favorite language of the user and update the corresponding label.
function favorite_lang(language_label, response, is_from_memory){

    if (is_from_memory == false){

        // sort=pushed is for getting the last pushed repositories.
        const repo_url = `https://api.github.com/users/${response["login"]}/repos?sort=pushed`;
        let req = new XMLHttpRequest();
        req.open('GET', repo_url);
        req.responseType = 'json';
        req.send();
        req.onload = function() {
            if (req.status != 200) { 
                console.log(`Error in repos ${req.status}: ${req.statusText}`); // e.g. 404: Not Found
            } else {
                const repos = req.response;
                // stores the languages and their number of occurance as key: value
                languages = {}
                for(let index=0; index< Math.min(5, repos.length); index++){
                    lan = repos[index]["language"];
                    if(lan == null){
                        continue;
                    }
                    if(lan == "Jupyter Notebook"){
                        lan = "Python";
                    }
                    // the || is for when the key do not exist and languages[lan] returns undifined it will replace updefined with 0
                    languages[lan] =  (languages[lan] || 0) + 1;
                }
                console.log(languages);
                most_frequent = find_most_frequent_lang(languages);
                language_label.innerText = most_frequent;
                response['language'] = most_frequent;
                save_in_localstorage(response);
            }
        }; 
    }
    else{
        language_label.innerText = response["language"];
    }
}

// this function will update the inner text for user information in html with values in response dict.
function update_information_box(response, is_from_memory){

    const photo = document.querySelector("#photo");
    const name = document.querySelector("#name");
    const blog = document.querySelector("#blog");
    const location = document.querySelector("#location");
    const bio = document.querySelector("#bio");
    const language = document.querySelector("#language");

    name.innerText = response["name"];
    blog.innerText = response["blog"];
    location.innerText = response["location"];
    if (response["bio"]){
        bio.innerText = response["bio"].replaceAll("\r\n", "");
    }
    photo.setAttribute("src", response["avatar_url"]);
    favorite_lang(language, response, is_from_memory);

}

// this function is called when the network connection is lost and display its corresponding error in webpage.
function connection_error(){
    console.log("Request failed");
    const errorlabel = document.querySelector("#error");
    errorlabel.innerText = "No network connection.";
}

// this funciton saved the needed information for user in localstorage.
function save_in_localstorage(response){
    var saved_dict = {"avatar_url": response['avatar_url'], "name":response["name"], "blog": response['blog'], "location": response["location"], "bio":response['bio'], "language":response['language']};
    // because setitem stores string i need to apply JSON.stringify to the dict.
    window.localStorage.setItem(response["login"], JSON.stringify(saved_dict));
    console.log("saved successfully in localstorage.");
}

// this function load the user information from localstorage.
function load_from_localstorage(user_id){
    // cause getitem return string i need to convert it to dict with JSON.parse.
    const saved_response = JSON.parse(window.localStorage.getItem(user_id));
    console.log(saved_response);
    return saved_response;

}

// add event listener for form when it is submit.
form.addEventListener('submit', (event) => {
    const user_id = form.elements['user-id'].value;
    const existKey = (window.localStorage.getItem(user_id) !== null);
    reset();
    // check if the use id exist in local storage
    if (existKey){
        response = load_from_localstorage(user_id);
        response["bio"] = response["bio"] + "\nload from localstorage :))";
        is_from_memory = true;
        update_information_box(response, is_from_memory);
    }
    else{
        // if the user id do not exist in localstorage, send query to github api for user information
        let req = new XMLHttpRequest();
        req.open('GET', API_URL + user_id);
        req.responseType = 'json';
        req.send();
        // if the request is send:
        req.onload = function() {
            // analyze HTTP status of the response
            if (req.status != 200) { 
                console.log(`Error ${req.status}: ${req.statusText}`); // e.g. 404: Not Found
                notfound()
            } else {
                const response = req.response;
                is_from_memory = false;
                update_information_box(response, is_from_memory);
                // save_in_localstorage(response);
            }
        };
        // if a connection error accures
        req.onerror = function() {
            connection_error();
        };
    }
    
    event.preventDefault();
});



// window.localStorage.clear();