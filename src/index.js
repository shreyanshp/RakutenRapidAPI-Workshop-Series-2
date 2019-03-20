// References to all the element we will need.
var video = document.querySelector("#camera-stream"),
  image = document.querySelector("#snap"),
  start_camera = document.querySelector("#start-camera"),
  controls = document.querySelector(".controls"),
  take_photo_btn = document.querySelector("#take-photo"),
  delete_photo_btn = document.querySelector("#delete-photo"),
  download_photo_btn = document.querySelector("#download-photo"),
  error_message = document.querySelector("#error-message"),
  api_request = document.querySelector("#api-photo"),
  camera_change = document.querySelector("#change-camera"),
  hidden_canvas,
  byteCharacters,
  context;

//call camera
changeCamera("environment");

// Mobile browsers cannot play video without user input,
// so here we're using a button to start it manually.
start_camera.addEventListener("click", function(e) {
  e.preventDefault();

  // Start video playback manually.
  video.play();
  showVideo();
});

take_photo_btn.addEventListener("click", function(e) {
  e.preventDefault();

  var snap = takeSnapshot();

  // Show image.
  image.setAttribute("src", snap);
  image.classList.add("visible");

  // Enable delete and save buttons
  delete_photo_btn.classList.remove("disabled");
  download_photo_btn.classList.remove("disabled");
  api_request.classList.remove("disabled");
  // Set the href attribute of the download button to the snap url.
  download_photo_btn.href = snap;

  // Pause video playback of stream.
  video.pause();
});

delete_photo_btn.addEventListener("click", function(e) {
  e.preventDefault();

  // Hide image.
  image.setAttribute("src", "");
  image.classList.remove("visible");

  // Disable delete and save buttons
  delete_photo_btn.classList.add("disabled");
  download_photo_btn.classList.add("disabled");
  api_request.classList.add("disabled");

  // Resume playback of stream.
  video.play();
});

api_request.addEventListener("click", function(e) {
  var computerVisionUrl =
    "https://microsoft-azure-microsoft-computer-vision-v1.p.rapidapi.com/analyze?visualfeatures=Categories%2CTags%2CColor%2CFaces%2CDescription";
  var ecommerceUrl =
    "https://rakuten_webservice-rakuten-marketplace-product-search-v1.p.rapidapi.com/services/api/Product/Search/20170426?keyword=";
  var mykey = "<your-key-here>";
  var imageData = new FormData();
  imageData.append("image", byteCharacters);
  sendRequest(computerVisionUrl, "POST", imageData, mykey)
    .then(function(category) {
      console.log("Success! on first request");
      console.log(JSON.parse(category.responseText).categories[0].name);
      return sendRequest(
        ecommerceUrl + JSON.parse(category.responseText).categories[0].name,
        "POST",
        "",
        mykey
      );
    })
    .then(function(product) {
      console.log("Success! on second request");
      console.log(JSON.parse(product.responseText).Items[0].Item.itemUrl);
    })
    .catch(function(error) {
      console.log("Something went wrong", error);
      alert(JSON.stringify(error));
    });
});

camera_change.addEventListener("click", function(e) {
  // Hide image.
  image.setAttribute("src", "");
  image.classList.remove("visible");
  // Disable delete and save buttons
  delete_photo_btn.classList.add("disabled");
  download_photo_btn.classList.add("disabled");
  api_request.classList.add("disabled");
  //stop current camera
  video.srcObject.getVideoTracks()[0].stop();
  //change camera
  changeCamera(camera_change.title);
  //update camera_change title to implement a toggle like feature
  if (camera_change.title == "environment") {
    camera_change.title = "user";
  } else {
    camera_change.title = "environment";
  }
  //start new camera
  video.play();
  showVideo();
});

function showVideo() {
  // Display the video stream and the controls.
  hideUI();
  video.classList.add("visible");
  controls.classList.add("visible");
}

function takeSnapshot() {
  // Here we're using a trick that involves a hidden canvas element.

  hidden_canvas = document.querySelector("canvas");
  context = hidden_canvas.getContext("2d");

  var width = video.videoWidth,
    height = video.videoHeight;

  if (width && height) {
    // Setup a canvas with the same dimensions as the video.
    hidden_canvas.width = width;
    hidden_canvas.height = height;

    // Make a copy of the current frame in the video on the canvas.
    context.drawImage(video, 0, 0, width, height);
    var block = hidden_canvas.toDataURL("image/png").split(";");
    // Get the content type of the image
    var contentType = block[0].split(":")[1]; // In this case "image/gif"
    // get the real base64 content of the file
    var realData = block[1].split(",")[1]; // In this case "R0lGODlhPQBEAPeoAJosM...."

    // Convert it to a blob to upload
    byteCharacters = b64toBlob(realData, contentType);
    // Turn the canvas image into a dataURL that can be used as a src for our photo.
    return hidden_canvas.toDataURL("image/png");
  }
}

function displayErrorMessage(error_msg, error) {
  error = error || "";
  if (error) {
    console.log(error);
  }

  error_message.innerHTML = error_msg;

  hideUI();
  error_message.classList.add("visible");
}

function hideUI() {
  // Helper function for clearing the app UI.
  controls.classList.remove("visible");
  start_camera.classList.remove("visible");
  video.classList.remove("visible");
  error_message.classList.remove("visible");
}

function b64toBlob(b64Data, contentType, sliceSize) {
  contentType = contentType || "";
  sliceSize = sliceSize || 512;

  var byteCharacters = atob(b64Data);
  var byteArrays = [];

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize);

    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    var byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  var blob = new Blob(byteArrays, { type: contentType });
  return blob;
}

var sendRequest = function(url, method, data, rakutenrapidapikey) {
  // Create the XHR request
  var request = new XMLHttpRequest();

  // Return it as a Promise
  return new Promise(function(resolve, reject) {
    // Setup our listener to process compeleted requests
    request.onreadystatechange = function() {
      // Only run if the request is complete
      if (request.readyState !== 4) return;

      // Process the response
      if (request.status >= 200 && request.status < 300) {
        // If successful
        resolve(request);
      } else {
        // If failed
        reject({
          status: request.status,
          statusText: request.statusText
        });
      }
    };

    // Setup our HTTP request
    request.open(method || "POST", url, true);

    request.setRequestHeader("X-RapidAPI-Key", rakutenrapidapikey);
    // Send the request
    request.send(data);
  });
};

function changeCamera(data) {
  navigator.getMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

  if (!navigator.getMedia) {
    var constraints = { video: { facingMode: data } };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function(mediaStream) {
        video.srcObject = mediaStream;
        video.onloadedmetadata = function(e) {
          video.play();
          video.onplay = function() {
            showVideo();
          };
        };
      })
      .catch(function(err) {
        displayErrorMessage(
          "There was an error with accessing the camera stream: " + err.name,
          err
        );
        console.log(err.name + ": " + err.message);
      }); // always check for errors at the end.
  } else {
    navigator.getMedia(
      {
        video: { facingMode: data }
      },
      // Success Callback
      function(stream) {
        // Create an object URL for the video stream and
        // set it as src of our HTML video element.
        video.srcObject = stream;

        // Play the video element to start the stream.
        video.play();
        video.onplay = function() {
          showVideo();
        };
      },
      // Error Callback
      function(err) {
        var helpurl = "https://support.google.com/chrome/answer/2693767";
        var str = "NotAllowedError";
        if (str.includes(err.name)) {
          displayErrorMessage(
            "<a href='" +
              helpurl +
              "'target='_blank'>Please give us permission to access your camera, you can check this help link for Chrome</a>",
            err
          );
        } else {
          displayErrorMessage(
            "There was an error with accessing the camera stream: " + err.name,
            err
          );
        }
      }
    );
  }
}
