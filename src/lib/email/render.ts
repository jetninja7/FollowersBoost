/**
 * Email Template Renderer
 *
 * Renders React Email components to HTML strings.
 */

import { render } from '@react-email/components';
import { ReactElement } from 'react';

/**
 * Render email template to HTML
 */
export async function renderEmail(template: ReactElement): Promise<string> {
  return render(template);
}

/**
 * Render email template to plain text
 */
export async function renderEmailText(template: ReactElement): Promise<string> {
  return render(template, { plainText: true });
}
