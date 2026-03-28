/**
 * AI Chatbot Frontend JavaScript
 */

(function($) {
    'use strict';

    const Chatbot = {
        conversationHistory: [],
        isOpen: false,
        isProcessing: false,

        init: function() {
            this.bindEvents();
            this.applyCustomStyles();
            this.loadConversationHistory();
        },

        bindEvents: function() {
            const self = this;

            // Toggle chatbot window
            $('#tishonator-chatbot-toggle, #tishonator-chatbot-minimize').on('click', function(e) {
                e.preventDefault();
                self.toggleWindow();
            });

            // Handle form submission
            $('#tishonator-chatbot-form').on('submit', function(e) {
                e.preventDefault();
                self.sendMessage();
            });

            // Handle Enter key (without Shift for send)
            $('#tishonator-chatbot-input').on('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    self.sendMessage();
                }
            });

            // Close on escape key
            $(document).on('keydown', function(e) {
                if (e.key === 'Escape' && self.isOpen) {
                    self.toggleWindow();
                }
            });
        },

        applyCustomStyles: function() {
            const primaryColor = tishonatorChatbot.primaryColor || '#0084ff';
            const secondaryColor = tishonatorChatbot.secondaryColor || '#f1f0f0';
            const position = tishonatorChatbot.position || 'bottom-right';

            // Apply custom CSS variables
            const root = document.documentElement;
            root.style.setProperty('--chatbot-primary-color', primaryColor);
            root.style.setProperty('--chatbot-secondary-color', secondaryColor);

            // Apply position
            const widget = $('#tishonator-chatbot-widget');
            if (position === 'bottom-left') {
                widget.addClass('tishonator-chatbot-left');
            } else {
                widget.addClass('tishonator-chatbot-right');
            }
        },

        toggleWindow: function() {
            const window = $('#tishonator-chatbot-window');
            const toggle = $('#tishonator-chatbot-toggle');

            if (this.isOpen) {
                window.removeClass('tishonator-chatbot-window-open');
                toggle.removeClass('tishonator-chatbot-toggle-active');
                this.isOpen = false;
            } else {
                window.addClass('tishonator-chatbot-window-open');
                toggle.addClass('tishonator-chatbot-toggle-active');
                this.isOpen = true;
                this.scrollToBottom();
                $('#tishonator-chatbot-input').focus();
            }
        },

        sendMessage: function() {
            if (this.isProcessing) {
                return;
            }

            const input = $('#tishonator-chatbot-input');
            const message = input.val().trim();

            if (!message) {
                return;
            }

            // Add user message to UI
            this.addMessage('user', message);

            // Clear input
            input.val('');

            // Add to conversation history
            this.conversationHistory.push({
                role: 'user',
                content: message
            });

            // Save to localStorage
            this.saveConversationHistory();

            // Show typing indicator
            this.showTypingIndicator();

            // Send to server
            this.isProcessing = true;

            $.ajax({
                url: tishonatorChatbot.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'tishonator_chatbot_message',
                    nonce: tishonatorChatbot.nonce,
                    message: message,
                    history: JSON.stringify(this.conversationHistory)
                },
                success: (response) => {
                    this.hideTypingIndicator();
                    this.isProcessing = false;

                    if (response.success && response.data.response) {
                        this.addMessage('assistant', response.data.response);
                        this.conversationHistory.push({
                            role: 'assistant',
                            content: response.data.response
                        });
                        this.saveConversationHistory();
                    } else {
                        const errorMessage = response.data?.message || 'Sorry, I encountered an error. Please try again.';
                        this.addMessage('assistant', errorMessage);
                    }
                },
                error: (xhr, status, error) => {
                    this.hideTypingIndicator();
                    this.isProcessing = false;
                    this.addMessage('assistant', 'Sorry, I\'m having trouble connecting. Please try again later.');
                    console.error('Chatbot error:', error);
                }
            });
        },

        addMessage: function(role, content) {
            const messagesContainer = $('#tishonator-chatbot-messages');
            const messageClass = role === 'user' ? 'tishonator-chatbot-message-user' : 'tishonator-chatbot-message-bot';

            const avatarSvg = role === 'user'
                ? '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/></svg>';

            const messageHtml = `
                <div class="tishonator-chatbot-message ${messageClass}">
                    ${role === 'assistant' ? `<div class="tishonator-chatbot-message-avatar">${avatarSvg}</div>` : ''}
                    <div class="tishonator-chatbot-message-content">${this.formatMessage(content)}</div>
                    ${role === 'user' ? `<div class="tishonator-chatbot-message-avatar">${avatarSvg}</div>` : ''}
                </div>
            `;

            messagesContainer.append(messageHtml);
            this.scrollToBottom();
        },

        formatMessage: function(message) {
            // Convert markdown-like formatting
            let formatted = message
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **bold**
                .replace(/\*(.*?)\*/g, '<em>$1</em>')              // *italic*
                .replace(/\n/g, '<br>');                           // line breaks

            // Escape any HTML that wasn't part of our formatting
            const div = document.createElement('div');
            div.innerHTML = formatted;

            return formatted;
        },

        showTypingIndicator: function() {
            $('#tishonator-chatbot-typing').show();
            this.scrollToBottom();
        },

        hideTypingIndicator: function() {
            $('#tishonator-chatbot-typing').hide();
        },

        scrollToBottom: function() {
            const messagesContainer = $('#tishonator-chatbot-messages');
            setTimeout(function() {
                messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
            }, 100);
        },

        saveConversationHistory: function() {
            try {
                // Keep only last 20 messages to avoid localStorage limits
                const historyToSave = this.conversationHistory.slice(-20);
                localStorage.setItem('tishonator_chatbot_history', JSON.stringify(historyToSave));
            } catch (e) {
                console.warn('Could not save conversation history:', e);
            }
        },

        loadConversationHistory: function() {
            try {
                const saved = localStorage.getItem('tishonator_chatbot_history');
                if (saved) {
                    this.conversationHistory = JSON.parse(saved);

                    // Restore messages to UI (excluding welcome message)
                    this.conversationHistory.forEach((msg) => {
                        if (msg.role && msg.content) {
                            this.addMessage(msg.role, msg.content);
                        }
                    });
                }
            } catch (e) {
                console.warn('Could not load conversation history:', e);
                this.conversationHistory = [];
            }
        },

        clearHistory: function() {
            this.conversationHistory = [];
            localStorage.removeItem('tishonator_chatbot_history');
            $('#tishonator-chatbot-messages .tishonator-chatbot-message').not(':first').remove();
        }
    };

    // Initialize chatbot when document is ready
    $(document).ready(function() {
        Chatbot.init();

        // Expose clear history function globally for debugging
        window.tishonatorChatbotClearHistory = function() {
            Chatbot.clearHistory();
            console.log('Chatbot history cleared');
        };
    });

})(jQuery);
