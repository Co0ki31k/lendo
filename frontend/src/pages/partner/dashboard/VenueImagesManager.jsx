import { useEffect, useState } from 'react'
import { partnerApi } from '../../../api'

function VenueImagesManager({ venueId, selectedVenue = null }) {
  const [images, setImages] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [uploadFiles, setUploadFiles] = useState([])
  const [displayOrder, setDisplayOrder] = useState('')
  const [primaryImage, setPrimaryImage] = useState(false)
  const [activeRequest, setActiveRequest] = useState('')

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
      const startingDisplayOrder = displayOrder === '' ? null : Number(displayOrder)
      const createdImages = []

      for (const [index, file] of uploadFiles.entries()) {
        const createdImage = await partnerApi.uploadVenueImage(venueId, {
          file,
          displayOrder: startingDisplayOrder == null ? '' : startingDisplayOrder + index,
          primaryImage: primaryImage && index === 0,
        })

        createdImages.push(createdImage)
      }

      const createdPrimaryImageId = createdImages.find((image) => image.primaryImage)?.id
      const nextImages = [...images, ...createdImages].sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0))

      setImages(
        createdPrimaryImageId
          ? nextImages.map((image) => ({ ...image, primaryImage: image.id === createdPrimaryImageId }))
          : nextImages,
      )
      setUploadFiles([])
      setDisplayOrder('')
      setPrimaryImage(false)
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

  async function handleSetPrimary(imageId) {
    setActiveRequest(`primary:${imageId}`)
    setError('')

    try {
      await partnerApi.setPrimaryVenueImage(venueId, imageId)
      setImages((currentImages) => currentImages.map((image) => ({
        ...image,
        primaryImage: image.id === imageId,
      })))
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie ustawic zdjecia glownego.')
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
        <label className="partner-dashboard__field partner-dashboard__field--full">
          <span>Pliki obrazkow</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setUploadFiles(Array.from(event.target.files ?? []))}
            required
          />
        </label>

        <label className="partner-dashboard__field">
          <span>Kolejnosc wyswietlania</span>
          <input type="number" min="0" value={displayOrder} onChange={(event) => setDisplayOrder(event.target.value)} placeholder="Auto" />
        </label>

        <label className="partner-dashboard__toggle partner-dashboard__field--full">
          <input type="checkbox" checked={primaryImage} onChange={(event) => setPrimaryImage(event.target.checked)} />
          <span>Ustaw pierwsze z dodawanych zdjec jako glowne</span>
        </label>

        <button type="submit" className="partner-dashboard__submit" disabled={activeRequest === 'upload'}>
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
                <span className={`partner-dashboard__status-badge ${image.primaryImage ? 'partner-dashboard__status-badge--approved' : ''}`}>
                  {image.primaryImage ? 'Glowne' : `Pozycja ${image.displayOrder}`}
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
                  className="partner-dashboard__secondary-action"
                  onClick={() => handleSetPrimary(image.id)}
                  disabled={image.primaryImage || activeRequest === `primary:${image.id}`}
                >
                  Ustaw glowne
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
