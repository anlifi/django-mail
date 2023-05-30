document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archive').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Send email when compose form is submitted
  document.querySelector('#compose-form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function archive_email(email_id, to_archive) {
  
  // Send PUT request to /emails/<email_id> to set email to archived (or to unarchived)
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: to_archive
    })
  })
  .then(() => load_mailbox('inbox'))
  .catch(error => console.log('Error:', error)); // Catch error
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-email-view').style.display = 'none';
  
  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#compose-error').innerHTML = ''
}

function load_email(mailbox, email_id) {
  
  // Show single email and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'block';

  // Get single-email-view element and clear content
  const single_email = document.querySelector('#single-email-view');
  single_email.innerHTML = '';

  // Send GET request to /emails/<email_id> to request email
  fetch(`emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    // Print email
    console.log(email);

    // If error, show error
    if ('error' in email) {
      const error_div = document.createElement('div');
      error_div.classList.add('error');
      error_div.innerHTML = email['error'];
      document.querySelector('#single-email-view').append(error_div);
    }

    // Show email header
    const email_header_elements = [['From', 'sender'], ['To', 'recipients'], ['Subject', 'subject'], ['Timestamp', 'timestamp']]
    email_header_elements.forEach(element => {
      const element_title = element[0];
      const element_content = element[1];
      const element_row_div = document.createElement('div');
      element_row_div.classList.add('row', `section-email-${element_content}`);
      element_row_div.innerHTML = `<p><span class="section-email-title">${element_title}:</span> ${email[element_content]}</p>`

      single_email.append(element_row_div);
    });

    // Add buttons for reply and archive/unarchive
    const buttons_to_add = [
      ['Reply', reply_email(email)]
      [email['archived'] ? 'Unarchive' : 'Archive', archive_email(email_id, !email['archived'])]
    ];
    const btn_row_div = document.createElement('div');
    btn_row_div.classList.add('row', 'section-email-btns');

    // Add reply button
    const reply_btn = document.createElement('button');
    reply_btn.classList.add('btn', 'btn-sm', 'btn-outline-primary');
    reply_btn.innerHTML = 'Reply';
    reply_btn.addEventListener('click', () => reply_email(email))

    btn_row_div.append(reply_btn);

    // Add button for archive if inbox email or unarchive if archived email
    if (['inbox', 'archive'].includes(mailbox)) {
      const archive_btn = document.createElement('button');
      archive_btn.classList.add('btn', 'btn-sm', 'btn-outline-primary');
      archive_btn.innerHTML = email['archived'] ? 'Unarchive' : 'Archive';
      archive_btn.addEventListener('click', () => archive_email(email_id, !email['archived']));

      btn_row_div.append(archive_btn);
    }

    single_email.append(btn_row_div);

    // Separate email header and body
    single_email.append(document.createElement('hr'));

    // Show email body
    const body_div = document.createElement('div');
    body_div.classList.add('container', `section-email-body`);
    body_div.innerHTML = `<p>${email.body.replace(/\n/gm, '<br>')}</p>`;

    single_email.append(body_div);
  })
  .catch(error => console.log('Error:', error)); // Catch error

  // Send PUT request to /emails/<email_id> to mark email as read
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
  .catch(error => console.log('Error:', error)); // Catch error
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';

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

    // If error, show error
    if ('error' in emails) {
      const error_div = document.createElement('div');
      error_div.classList.add('error');
      error_div.innerHTML = email['error'];
      document.querySelector('#emails-view').append(error_div);
      return;
    }

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
        div_section.classList.add(`col-${section_col_size}`, `section-${section_name}`);
        div_section.innerHTML = `<p>${email[section_name]}</p>`;

        div_row_element.append(div_section);
      });

      document.querySelector('#emails-view').append(div_row_element);
      
      // Load single email when email row element is clicked
      div_row_element.addEventListener('click', () => load_email(mailbox, email['id']));
    });
  })
  .catch(error => console.log('Error:', error)); // Catch error
}

function reply_email(email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-email-view').style.display = 'none';
  
  // Clear out composition error field
  document.querySelector('#compose-error').innerHTML = ''

  // Pre-fill recipient, subject and body
  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-subject').value = (email.subject.includes('Re: ')) ? email.subject : `Re: ${email.subject}`;
  const pre_body_text = `\n\n\n-------------------------------------------------\nOn ${email.timestamp} ${email.sender} wrote:`
  document.querySelector('#compose-body').value = `${pre_body_text}\n\n${email.body}`;
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
    if ('error' in result) {
      const error_div = document.querySelector('#compose-error');
      error_div.classList.add('error')
      error_div.innerHTML = result['error'];
    }
    
    // Show user's sent mailbox
    load_mailbox('sent');
  })
  .catch(error => console.log('Error:', error)); // Catch error

  // Stop form from submitting
  return false;
}