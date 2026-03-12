/* eslint-disable react/react-in-jsx-scope */
import { LoadingOutlined } from '@ant-design/icons'
import { images } from 'config/images'
import { createContext, useEffect, useState } from 'react'

// Create a context to manage the script loading state
const CloudinaryScriptContext = createContext()

const CloudinaryUploadWidget = ({ uwConfig, setPublicInfo, isUploading = false, isLoaded = false }) => {
  // const [loaded, setLoaded] = useState(false)

  // useEffect(() => {
  //   // Check if the script is already loaded
  //   if (!loaded) {
  //     const uwScript = document.getElementById('uw')
  //     if (!uwScript) {
  //       // If not loaded, create and load the script
  //       const script = document.createElement('script')
  //       script.setAttribute('async', '')
  //       script.setAttribute('id', 'uw')
  //       script.src = 'https://upload-widget.cloudinary.com/global/all.js'
  //       script.addEventListener('load', () => setLoaded(true))
  //       document.body.appendChild(script)
  //     } else {
  //       // If already loaded, update the state
  //       setLoaded(true)
  //     }
  //   }
  // }, [loaded])
  let successfulUploads
  let clickCount = 0

  const processResults = async (error, result) => {
    if (error) {
      console.log(error)
    }

    if (!error && result && result.event === 'success') {
      // Send the result object to backend to save image data in database
      // When multiple images are uploaded, this event happens for each image
      // const serverResponseData = await sendImageDataToServer(result); // returns {success: true or false}
      setPublicInfo(result.info)
      successfulUploads++
      // ...
    }
    if (error && result && result.event === 'close') {
      // do not redirect. Reload page.
      clickCount = 0
      successfulUploads = 0
      document.querySelectorAll('iframe')
        .forEach((iframe, indexFrame) => iframe.remove())
    }

    if (!error && result && result.event === 'close') {
      // In a separate script, observer is listening for data-set attribute changes to dataDivResults
      // When the attribute changes, the observer will redirect to the album page
      if (successfulUploads > 0) {
        const dataDivResults = document.getElementById('dataDivResults')
        dataDivResults.dataset.uploadResult = 'success'
      }

      document.querySelectorAll('iframe')
        .forEach((iframe, indexFrame) => iframe.remove())
    }
  }

  const initializeCloudinaryWidget = async () => {
    if (clickCount === 1) {
      var myWidget = await window.cloudinary.createUploadWidget(
        uwConfig,
        processResults
      )

      document.querySelector('iframe').style.display = 'block'

      document.getElementById('upload_widget').addEventListener(
        'click',
        function () {
          myWidget.open()
        },
        false
      )
    } else {
      clickCount++
      initializeCloudinaryWidget()
    }
  }

  return (
    <CloudinaryScriptContext.Provider value={{ loaded: isLoaded }}>
      <button
        id='upload_widget'
        className='cloudinary-button'
        style={{
          backgroundColor: 'white',
          height: '70px',
          width: '100%',
          maxWidth: '80px',
          marginTop: '10px'
        }}
        onClick={initializeCloudinaryWidget}
      >
        <div className='ant-upload-text'>
          {isUploading ? (
            <LoadingOutlined />
          ) : (
            <img src={images.increase} />
          )}
        </div>
      </button>
    </CloudinaryScriptContext.Provider>
  )
}

export default CloudinaryUploadWidget
export { CloudinaryScriptContext }
