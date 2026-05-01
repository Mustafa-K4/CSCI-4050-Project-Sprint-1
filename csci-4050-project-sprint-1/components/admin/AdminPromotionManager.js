'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './AdminPortal.module.css';

const INITIAL_FORM = {
  description: '',
  discountAmount: '',
  expirationDate: '',
  promoCode: '',
};

function validatePromotionForm(form) {
  if (!form.description.trim()) return 'Promotion description is required.';
  if (!form.promoCode.trim()) return 'Promotion code is required.';
  if (!/^[A-Za-z0-9_-]{3,24}$/.test(form.promoCode.trim())) {
    return 'Promotion code must be 3-24 characters using letters, numbers, dashes, or underscores.';
  }
  if (!form.discountAmount || Number(form.discountAmount) <= 0) {
    return 'Discount amount must be greater than 0.';
  }
  if (!form.expirationDate) return 'Expiration date is required.';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expirationDate = new Date(`${form.expirationDate}T00:00:00`);
  if (expirationDate < today) return 'Expiration date cannot be in the past.';

  return '';
}

function formatDate(value) {
  if (!value) return 'No date set';
  return new Date(value).toLocaleDateString();
}

function isExpired(value) {
  if (!value) return false;
  const expirationDate = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expirationDate < today;
}

export default function AdminPromotionManager() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadPromotions() {
    setLoading(true);
    try {
      const response = await fetch('/api/promotions');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to load promotions.');
      }
      setPromotions(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load promotions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPromotions();
  }, []);

  const sortedPromotions = useMemo(() => promotions, [promotions]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setError('');
    setSuccess('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validatePromotionForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          promoCode: form.promoCode.trim().toUpperCase(),
          discountAmount: Number(form.discountAmount),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to add promotion.');
      }

      setSuccess(`Promotion ${data.promoCode} was added successfully.`);
      setForm(INITIAL_FORM);
      await loadPromotions();
    } catch (saveError) {
      setError(saveError.message || 'Unable to add promotion.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSendPromotion(promotion) {
    setError('');
    setSuccess('');
    setSendingId(promotion._id);

    try {
      const response = await fetch(`/api/promotions/${promotion._id}/send`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok && response.status !== 207) {
        throw new Error(data?.error || 'Unable to send promotion.');
      }

      setSuccess(
        `Promotion ${promotion.promoCode} sent to ${data.sentCount} subscribed user${data.sentCount === 1 ? '' : 's'}.`
      );
      await loadPromotions();
    } catch (sendError) {
      setError(sendError.message || 'Unable to send promotion.');
    } finally {
      setSendingId('');
    }
  }

  return (
    <div className={styles.twoColumnLayout}>
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <h2 className={styles.sectionTitle}>Add Promotion</h2>
            <p className={styles.sectionText}>
              Create a promotion with validated required fields, then send it to subscribed users.
            </p>
          </div>
          <span className={styles.countBadge}>{sortedPromotions.length} Total</span>
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}
        {success ? <div className={styles.success}>{success}</div> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>
              Description<span className={styles.required}>*</span>
            </span>
            <textarea
              className={styles.textarea}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the promotion customers will receive"
            />
          </label>

          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.label}>
                Promo Code<span className={styles.required}>*</span>
              </span>
              <input
                className={styles.input}
                name="promoCode"
                value={form.promoCode}
                onChange={handleChange}
                placeholder="SUMMER25"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>
                Discount Amount<span className={styles.required}>*</span>
              </span>
              <input
                className={styles.input}
                name="discountAmount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.discountAmount}
                onChange={handleChange}
                placeholder="5.00"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>
                Expiration Date<span className={styles.required}>*</span>
              </span>
              <input
                className={styles.input}
                name="expirationDate"
                type="date"
                value={form.expirationDate}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className={styles.buttonRow}>
            <button className={styles.primaryButton} type="submit" disabled={saving}>
              {saving ? 'Adding...' : 'Add Promotion'}
            </button>
            <button className={styles.secondaryButton} type="button" onClick={resetForm} disabled={saving}>
              Clear Form
            </button>
          </div>
        </form>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <h2 className={styles.sectionTitle}>Send Promotions</h2>
            <p className={styles.sectionText}>
              Send a saved promotion email to active users who opted into promotions.
            </p>
          </div>
        </div>

        {loading ? (
          <div className={styles.emptyState}>Loading promotions...</div>
        ) : sortedPromotions.length === 0 ? (
          <div className={styles.emptyState}>No promotions have been added yet.</div>
        ) : (
          <div className={styles.list}>
            {sortedPromotions.map((promotion) => {
              const expired = isExpired(promotion.expirationDate);
              const alreadySent = Boolean(promotion.sentAt);
              return (
                <article key={promotion._id} className={styles.listCard}>
                  <div className={styles.listTitleRow}>
                    <div>
                      <h3 className={styles.listTitle}>{promotion.promoCode}</h3>
                      <p className={styles.helper}>{promotion.description}</p>
                    </div>
                    <span className={styles.modeTag}>
                      {expired ? 'Expired' : alreadySent ? 'Sent' : 'Ready'}
                    </span>
                  </div>

                  <div className={styles.metaRow}>
                    <span className={styles.metaPill}>
                      ${Number(promotion.discountAmount || 0).toFixed(2)} off
                    </span>
                    <span className={styles.metaPill}>Expires {formatDate(promotion.expirationDate)}</span>
                    {alreadySent ? (
                      <span className={styles.metaPill}>
                        Sent to {promotion.sentToCount || 0}
                      </span>
                    ) : null}
                  </div>

                  <div className={styles.listActions}>
                    <button
                      className={styles.primaryButton}
                      type="button"
                      onClick={() => handleSendPromotion(promotion)}
                      disabled={expired || sendingId === promotion._id}
                    >
                      {sendingId === promotion._id ? 'Sending...' : alreadySent ? 'Send Again' : 'Send Email'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
