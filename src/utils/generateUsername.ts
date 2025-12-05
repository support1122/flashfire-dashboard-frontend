/**
 * Generates a username from first name, last name, and a random number
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Generated username in format "FirstNameLastNameXXXX" where XXXX is a random 4-digit number
 */
export function generateUsername(firstName?: string, lastName?: string): string {
     // Clean and format names
     const cleanFirstName = (firstName || '').trim().replace(/[^a-zA-Z]/g, '');
     const cleanLastName = (lastName || '').trim().replace(/[^a-zA-Z]/g, '');

     // Generate random 4-digit number
     const randomNumber = Math.floor(1000 + Math.random() * 9000);

     // Combine names and number
     const username = `${cleanFirstName}${cleanLastName}${randomNumber}`;

     // Fallback if no names provided
     if (!cleanFirstName && !cleanLastName) {
          return `User${randomNumber}`;
     }

     return username;
}

/**
 * Generates a referral identifier (not a link, just the identifier)
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Referral identifier in format "FirstNameLastNameXXXX"
 */
export function generateReferralIdentifier(firstName?: string, lastName?: string): string {
     return generateUsername(firstName, lastName);
}
