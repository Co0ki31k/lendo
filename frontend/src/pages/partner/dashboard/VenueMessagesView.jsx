import { useEffect, useState } from 'react'
import { partnerApi } from '../../../api'

function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function VenueMessagesView({ selectedVenue }) {
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [inquiries, setInquiries] = useState([])

  useEffect(() => {
    let isMounted = true

    async function loadInquiries() {
      setStatus('loading')
      setError('')

      try {
        const response = await partnerApi.getVenueInquiries(selectedVenue.id)

        if (!isMounted) {
          return
        }

        setInquiries(response)
        setStatus('ready')
      } catch (requestError) {
        if (!isMounted) {
          return
        }

        setError(requestError.response?.data?.message ?? 'Nie udalo sie pobrac wiadomosci obiektu.')
        setStatus('error')
      }
    }

    void loadInquiries()

    return () => {
      isMounted = false
    }
  }, [selectedVenue.id])

  if (status === 'loading') {
    return (
      <section className="partner-dashboard__workspace">
        <p className="partner-dashboard__empty">Ladowanie wiadomosci obiektu...</p>
      </section>
    )
  }

  if (status === 'error') {
    return (
      <section className="partner-dashboard__workspace">
        <div className="partner-dashboard__placeholder-panel">
          <strong>Nie udalo sie pobrac wiadomosci</strong>
          <span>{error}</span>
        </div>
      </section>
    )
  }

  return (
    <section className="partner-dashboard__workspace">
      <div className="partner-dashboard__workspace-header">
        <div>
          <span className="partner-dashboard__workspace-eyebrow">Obiekt</span>
          <h2>{selectedVenue.name} - Wiadomosci</h2>
          <p>Lista zapytan wyslanych przez katalog do tego obiektu.</p>
        </div>
      </div>

      <div className="partner-dashboard__messages-list">
        {inquiries.length > 0 ? (
          inquiries.map((inquiry) => (
            <article key={inquiry.id} className="partner-dashboard__message-card">
              <div className="partner-dashboard__message-meta">
                <strong>{inquiry.contactEmail}</strong>
                <span>{inquiry.contactPhone || 'Brak numeru telefonu'}</span>
              </div>
              <p className="partner-dashboard__message-text">{inquiry.messageText}</p>
              <span className="partner-dashboard__message-date">
                {formatDateTime(inquiry.createdAt)}
              </span>
            </article>
          ))
        ) : (
          <div className="partner-dashboard__placeholder-panel">
            <strong>Brak wiadomosci</strong>
            <span>Na razie nikt nie wyslal zapytania do tego obiektu.</span>
          </div>
        )}
      </div>
    </section>
  )
}

export default VenueMessagesView
