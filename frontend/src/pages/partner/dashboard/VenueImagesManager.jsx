import { useEffect, useState } from 'react'
import { partnerApi } from '../../../api'

function VenueImagesManager({ venueId, selectedVenue = null }) {
  const [images, setImages] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [uploadFiles, setUploadFiles] = useState([])
  const [activeRequest, setActiveRequest] = useState('')
  const [isDragActive, setIsDragActive] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadImages() {
      setStatus('loading')
      setError('')

      try {
        const response = await partnerApi.getVenueImages(venueId)

        if (!isMounted) {
          return
        }

        setImages(response)
        setStatus('ready')
      } catch (requestError) {
        if (!isMounted) {
          return
        }

        setError(requestError.response?.data?.message ?? 'Nie udalo sie pobrac zdjec obiektu.')
        setStatus('error')
      }
    }

    void loadImages()

    return () => {
      isMounted = false
    }
  }, [venueId])

  function mergeFiles(nextFiles) {
    if (!nextFiles.length) {
      return
    }

    setUploadFiles((currentFiles) => {
      const existingKeys = new Set(currentFiles.map((file) => `${file.name}:${file.size}:${file.lastModified}`))
      const deduplicatedFiles = nextFiles.filter((file) => !existingKeys.has(`${file.name}:${file.size}:${file.lastModified}`))
      return [...currentFiles, ...deduplicatedFiles]
    })
  }

  function handleFileInputChange(event) {
    mergeFiles(Array.from(event.target.files ?? []))
  }

  function handleDragOver(event) {
    event.preventDefault()
    setIsDragActive(true)
  }

  function handleDragLeave(event) {
    event.preventDefault()
    setIsDragActive(false)
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragActive(false)
    mergeFiles(Array.from(event.dataTransfer.files ?? []).filter((file) => file.type.startsWith('image/')))
  }

  function handleRemovePendingFile(fileToRemove) {
    setUploadFiles((currentFiles) => currentFiles.filter((file) => file !== fileToRemove))
  }

  async function handleUpload(event) {
    event.preventDefault()
    const formElement = event.currentTarget

    if (uploadFiles.length === 0) {
      setError('Wybierz przynajmniej jeden plik obrazka do przeslania.')
      return
    }

    setActiveRequest('upload')
    setError('')

    try {
      const createdImages = []

      for (const file of uploadFiles) {
        const createdImage = await partnerApi.uploadVenueImage(venueId, {
          file,
          displayOrder: '',
          primaryImage: images.length === 0,
        })

        createdImages.push(createdImage)
      }

      const nextImages = [...images, ...createdImages].sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0))
      setImages(nextImages)
      setUploadFiles([])
      formElement.reset()
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie przeslac zdjec.')
    } finally {
      setActiveRequest('')
    }
  }

  async function handleDelete(imageId) {
    setActiveRequest(`delete:${imageId}`)
    setError('')

    try {
      await partnerApi.deleteVenueImage(venueId, imageId)
      setImages((currentImages) => currentImages.filter((image) => image.id !== imageId))
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie usunac zdjecia.')
    } finally {
      setActiveRequest('')
    }
  }

  async function handleMove(imageId, direction) {
    const currentIndex = images.findIndex((image) => image.id === imageId)
    const targetIndex = currentIndex + direction

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= images.length) {
      return
    }

    const reorderedImages = [...images]
    const [movedImage] = reorderedImages.splice(currentIndex, 1)
    reorderedImages.splice(targetIndex, 0, movedImage)

    const nextOrderPayload = reorderedImages.map((image, index) => ({
      imageId: image.id,
      displayOrder: index,
    }))

    setActiveRequest(`order:${imageId}`)
    setError('')

    try {
      const updatedImages = await partnerApi.updateVenueImageOrder(venueId, nextOrderPayload)
      setImages(updatedImages)
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie zmienic kolejnosci zdjec.')
    } finally {
      setActiveRequest('')
    }
  }

  const content = (
    <>
      <div className="partner-dashboard__workspace-header">
        <div>
          <span className="partner-dashboard__workspace-eyebrow">{selectedVenue ? 'Obiekt' : 'Media'}</span>
          <h3 className="partner-dashboard__section-title">
            {selectedVenue ? `${selectedVenue.name} - Zdjecia` : 'Zdjecia obiektu'}
          </h3>
          <p>
            {selectedVenue
              ? 'Zarzadzaj galeria wybranego, zatwierdzonego obiektu.'
              : 'Dodawaj, usuwaj i ustawiaj kolejnosc galerii dla wybranego obiektu.'}
          </p>
        </div>
      </div>

      {error ? <p className="partner-dashboard__error">{error}</p> : null}

      <form className="partner-dashboard__image-upload" onSubmit={handleUpload}>
        <div className="partner-dashboard__field partner-dashboard__field--full">
          <span>Pliki obrazkow</span>
          <label
            className={`partner-dashboard__dropzone${isDragActive ? ' partner-dashboard__dropzone--active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              className="partner-dashboard__file-input"
              onChange={handleFileInputChange}
            />
            <strong>Przeciagnij zdjecia tutaj</strong>
            <span>albo kliknij, aby wybrac pliki z urzadzenia</span>
          </label>
          {uploadFiles.length > 0 ? (
            <div className="partner-dashboard__pending-files">
              {uploadFiles.map((file) => (
                <div key={`${file.name}-${file.lastModified}`} className="partner-dashboard__pending-file">
                  <div>
                    <strong>{file.name}</strong>
                    <span>{Math.max(1, Math.round(file.size / 1024))} KB</span>
                  </div>
                  <button
                    type="button"
                    className="partner-dashboard__pending-file-remove"
                    onClick={() => handleRemovePendingFile(file)}
                  >
                    Usun
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <button type="submit" className="partner-dashboard__submit" disabled={activeRequest === 'upload' || uploadFiles.length === 0}>
          {activeRequest === 'upload' ? 'Przesylanie...' : 'Dodaj zdjecia'}
        </button>
      </form>

      {status === 'loading' ? (
        <p className="partner-dashboard__empty">Ladowanie zdjec...</p>
      ) : status === 'error' ? null : images.length === 0 ? (
        <p className="partner-dashboard__empty">Ten obiekt nie ma jeszcze zadnych zdjec.</p>
      ) : (
        <div className="partner-dashboard__image-grid">
          {images.map((image, index) => (
            <article key={image.id} className="partner-dashboard__image-card">
              <img src={image.imageUrl} alt={`Zdjecie obiektu ${index + 1}`} className="partner-dashboard__image-preview" />

              <div className="partner-dashboard__image-meta">
                <span className={`partner-dashboard__status-badge ${index === 0 ? 'partner-dashboard__status-badge--approved' : ''}`}>
                  {index === 0 ? 'Glowne' : `Pozycja ${image.displayOrder}`}
                </span>
              </div>

              <div className="partner-dashboard__image-actions">
                <button
                  type="button"
                  className="partner-dashboard__secondary-action"
                  onClick={() => handleMove(image.id, -1)}
                  disabled={index === 0 || activeRequest === `order:${image.id}`}
                >
                  W gore
                </button>
                <button
                  type="button"
                  className="partner-dashboard__secondary-action"
                  onClick={() => handleMove(image.id, 1)}
                  disabled={index === images.length - 1 || activeRequest === `order:${image.id}`}
                >
                  W dol
                </button>
                <button
                  type="button"
                  className="partner-dashboard__secondary-action partner-dashboard__secondary-action--danger"
                  onClick={() => handleDelete(image.id)}
                  disabled={activeRequest === `delete:${image.id}`}
                >
                  Usun
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )

  if (selectedVenue) {
    return <section className="partner-dashboard__workspace">{content}</section>
  }

  return <section className="partner-dashboard__images-section">{content}</section>
}

export default VenueImagesManager
