document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Send email when compose form is submitted
  document.querySelector('#compose-form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#compose-error').innerHTML = ''
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show which mailbox is selected
  document.querySelectorAll("button").forEach(button => button.classList.remove("selected"));
  document.querySelector(`#${mailbox}`).classList.add("selected");

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Send GET request to /emails/<mailbox> to get list of emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print emails
    console.log(emails);

    // Create email elements and show in view
    const email_sections = [['sender', 4], ['subject', 4], ['timestamp', 4]]
    emails.forEach(email => {
      const div_row_element = document.createElement('div');
      div_row_element.classList.add('emails-row-item', 'row', 'border', 'border-dark', email['read'] ? 'read' : 'unread');

      // Create email section elements
      email_sections.forEach(section => {
        const section_name = section[0];
        const section_col_size = section[1];
        const div_section = document.createElement('div');
        div_section.classList.add(`col-${section_col_size}`, `section-${section_name}`)
        div_section.innerHTML = `<p>${email[section_name]}</p>`

        div_row_element.append(div_section);
      });

      document.querySelector('#emails-view').append(div_row_element);
    });
  })
  .catch(error => console.log('Error:', error)); // Catch error
}

function send_email() {

  // Send POST request to /emails with values for recipients, subject and body
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    // Print result
    console.log(result);

    // If error in result, show error message
    if ("error" in result) {
      document.querySelector('#compose-error').innerHTML = result['error'];
    }
    else {
      // Show user's sent mailbox
      load_mailbox('sent');
    }
  })
  .catch(error => console.log('Error:', error)); // Catch error

  // Stop form from submitting
  return false;
}