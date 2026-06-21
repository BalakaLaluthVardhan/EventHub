document.addEventListener('DOMContentLoaded', () => {
  // 1. Auto-dismiss Flash Alerts
  const alerts = document.querySelectorAll('.alert-dismissible');
  alerts.forEach(alert => {
    setTimeout(() => {
      // Trigger bootstrap close
      const closeBtn = alert.querySelector('.btn-close');
      if (closeBtn) closeBtn.click();
    }, 5000);
  });

  // 2. AJAX Wishlist Toggler
  const wishlistBtn = document.getElementById('wishlist-btn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const eventId = wishlistBtn.dataset.eventId;
      
      try {
        const response = await fetch(`/events/${eventId}/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.redirected) {
          window.location.href = '/login';
          return;
        }

        const data = await response.json();
        if (data.success) {
          const icon = wishlistBtn.querySelector('i');
          const textSpan = wishlistBtn.querySelector('.wishlist-text');
          
          if (data.wishlisted) {
            wishlistBtn.classList.add('wishlist-btn-active');
            icon.className = 'bi bi-heart-fill me-2';
            if (textSpan) textSpan.textContent = 'Wishlisted';
          } else {
            wishlistBtn.classList.remove('wishlist-btn-active');
            icon.className = 'bi bi-heart me-2';
            if (textSpan) textSpan.textContent = 'Add to Wishlist';
          }
        }
      } catch (error) {
        console.error('Error toggling wishlist:', error);
      }
    });
  }

  // 3. AI Event Description Generator
  const aiGenerateDescBtn = document.getElementById('ai-generate-desc-btn');
  if (aiGenerateDescBtn) {
    aiGenerateDescBtn.addEventListener('click', async () => {
      const titleInput = document.getElementById('event-title');
      const notesInput = document.getElementById('event-notes');
      const descTextarea = document.getElementById('event-description');
      const loader = document.getElementById('ai-desc-loader');
      const buttonText = document.getElementById('ai-desc-btn-text');

      if (!titleInput.value || !notesInput.value) {
        alert('Please fill out the Event Title and Notes/Highlights first!');
        return;
      }

      // Show loader
      loader.classList.remove('d-none');
      buttonText.textContent = 'Generating...';
      aiGenerateDescBtn.disabled = true;

      try {
        const response = await fetch('/events/ai/generate-description', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: titleInput.value,
            notes: notesInput.value
          })
        });

        const data = await response.json();
        if (data.success) {
          descTextarea.value = data.description;
          // Auto-trigger change event if any validation relies on it
          descTextarea.dispatchEvent(new Event('input'));
        } else {
          alert('AI Generation Error: ' + data.message);
        }
      } catch (err) {
        console.error('Error generating description:', err);
        alert('Failed to reach AI service.');
      } finally {
        // Reset button state
        loader.classList.add('d-none');
        buttonText.textContent = 'Generate Description with AI';
        aiGenerateDescBtn.disabled = false;
      }
    });
  }

  // 4. AI Category and Tag Assistant
  const aiSuggestCategoryBtn = document.getElementById('ai-suggest-category-btn');
  if (aiSuggestCategoryBtn) {
    aiSuggestCategoryBtn.addEventListener('click', async () => {
      const titleInput = document.getElementById('event-title');
      const descTextarea = document.getElementById('event-description');
      const categorySelect = document.getElementById('event-category');
      const tagsInput = document.getElementById('event-tags');
      const loader = document.getElementById('ai-cat-loader');
      const btnText = document.getElementById('ai-cat-btn-text');

      if (!titleInput.value || !descTextarea.value) {
        alert('Please fill out the Event Title and Description first!');
        return;
      }

      // Show loader
      loader.classList.remove('d-none');
      btnText.textContent = 'Analyzing...';
      aiSuggestCategoryBtn.disabled = true;

      try {
        const response = await fetch('/events/ai/suggest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: titleInput.value,
            description: descTextarea.value
          })
        });

        const data = await response.json();
        if (data.success) {
          categorySelect.value = data.category;
          tagsInput.value = data.tags.join(', ');
        } else {
          alert('AI Categorization Error: ' + data.message);
        }
      } catch (err) {
        console.error('Error suggesting category:', err);
        alert('Failed to reach AI service.');
      } finally {
        loader.classList.add('d-none');
        btnText.textContent = 'Auto-Categorize & Tag';
        aiSuggestCategoryBtn.disabled = false;
      }
    });
  }

  // 5. AI Review Summarizer (Organizer Detail / Dashboard view)
  const aiSummarizeBtn = document.getElementById('ai-summarize-reviews-btn');
  if (aiSummarizeBtn) {
    aiSummarizeBtn.addEventListener('click', async () => {
      const eventId = aiSummarizeBtn.dataset.eventId;
      const summaryText = document.getElementById('ai-summary-text');
      const loader = document.getElementById('ai-summary-loader');

      if (!eventId) return;

      // Show loader
      loader.classList.remove('d-none');
      aiSummarizeBtn.disabled = true;
      summaryText.textContent = 'Analyzing reviews and generating summary...';

      try {
        const response = await fetch(`/events/${eventId}/summarize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        if (data.success) {
          summaryText.textContent = data.summary;
        } else {
          summaryText.textContent = 'Failed to generate review summary: ' + data.message;
        }
      } catch (err) {
        console.error('Error generating summary:', err);
        summaryText.textContent = 'Error connecting to the AI summarization service.';
      } finally {
        loader.classList.add('d-none');
        aiSummarizeBtn.disabled = false;
      }
    });
  }

  // 6. Review Form Client-side Validation
  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      const ratingChecked = reviewForm.querySelector('input[name="review[rating]"]:checked');
      const commentInput = document.getElementById('review-comment');
      const errorDiv = document.getElementById('review-error');

      let errors = [];

      if (!ratingChecked) {
        errors.push('Star rating is required.');
      }
      if (!commentInput || !commentInput.value.trim()) {
        errors.push('Review comment is required.');
      }

      if (errors.length > 0) {
        e.preventDefault(); // Prevent form submission
        errorDiv.textContent = errors.join(' ');
        errorDiv.classList.remove('d-none');
      } else {
        errorDiv.classList.add('d-none');
      }
    });
  }
});
