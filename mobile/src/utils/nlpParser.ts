import { PriorityLevel } from '../types';

export interface ParsedTaskInput {
  title: string;
  priority?: PriorityLevel;
  category?: string;
  deadline?: Date;
  tags: string[];
}

const CATEGORY_MAP: Record<string, string> = {
  work: 'Work',
  job: 'Work',
  office: 'Work',
  personal: 'Personal',
  home: 'Personal',
  study: 'Study',
  learn: 'Study',
  school: 'Study',
  college: 'Study',
  health: 'Health',
  gym: 'Health',
  fitness: 'Health',
  finance: 'Finance',
  money: 'Finance',
};

/**
 * Parses natural language input strings like:
 * "Submit assignment tomorrow 5pm #study !urgent"
 * "Refactor auth middleware in 3 hours #work !high"
 */
export const parseNaturalLanguageTask = (input: string): ParsedTaskInput => {
  let text = input.trim();
  let priority: PriorityLevel | undefined;
  let category: string | undefined;
  let deadline: Date | undefined;
  const tags: string[] = [];

  if (!text) {
    return { title: '', tags: [] };
  }

  // 1. Extract Priority (!urgent, !high, !medium, !low, or !1, !2, !3, !4)
  const priorityRegex = /!(urgent|high|medium|low|1|2|3|4)\b/i;
  const priorityMatch = text.match(priorityRegex);
  if (priorityMatch) {
    const rawP = priorityMatch[1].toLowerCase();
    if (rawP === 'urgent' || rawP === '1') priority = 'URGENT';
    else if (rawP === 'high' || rawP === '2') priority = 'HIGH';
    else if (rawP === 'medium' || rawP === '3') priority = 'MEDIUM';
    else if (rawP === 'low' || rawP === '4') priority = 'LOW';

    text = text.replace(priorityRegex, '').trim();
  }

  // 2. Extract Category (#work, #personal, #study, etc.)
  const categoryRegex = /#([a-zA-Z0-9_-]+)\b/i;
  const categoryMatch = text.match(categoryRegex);
  if (categoryMatch) {
    const rawCat = categoryMatch[1].toLowerCase();
    category = CATEGORY_MAP[rawCat] || (rawCat.charAt(0).toUpperCase() + rawCat.slice(1));
    tags.push(rawCat);
    text = text.replace(categoryRegex, '').trim();
  }

  // 3. Extract Time & Deadline
  const now = new Date();

  // Pattern: "in X hours" / "in X hrs"
  const inHoursRegex = /\bin\s+(\d+)\s*(hours?|hrs?)\b/i;
  const inHoursMatch = text.match(inHoursRegex);

  // Pattern: "in X days"
  const inDaysRegex = /\bin\s+(\d+)\s*days?\b/i;
  const inDaysMatch = text.match(inDaysRegex);

  // Pattern: "tomorrow"
  const tomorrowRegex = /\btomorrow\b/i;
  const hasTomorrow = tomorrowRegex.test(text);

  // Pattern: "today"
  const todayRegex = /\btoday\b/i;
  const hasToday = todayRegex.test(text);

  // Pattern: "at 5pm", "at 17:00", "5pm", "10:30am"
  const timeRegex = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
  const timeMatch = text.match(timeRegex);

  let targetHour = 18; // default to 6:00 PM if date specified without explicit time
  let targetMinute = 0;

  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3].toLowerCase();

    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    targetHour = hours;
    targetMinute = minutes;
    text = text.replace(timeRegex, '').trim();
  }

  if (inHoursMatch) {
    const hrs = parseInt(inHoursMatch[1], 10);
    const d = new Date(now.getTime() + hrs * 60 * 60 * 1000);
    deadline = d;
    text = text.replace(inHoursRegex, '').trim();
  } else if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    const d = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    d.setHours(targetHour, targetMinute, 0, 0);
    deadline = d;
    text = text.replace(inDaysRegex, '').trim();
  } else if (hasTomorrow) {
    const d = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    d.setHours(targetHour, targetMinute, 0, 0);
    deadline = d;
    text = text.replace(tomorrowRegex, '').trim();
  } else if (hasToday) {
    const d = new Date();
    d.setHours(targetHour, targetMinute, 0, 0);
    if (d.getTime() < now.getTime()) {
      // If time has passed today, move by 2 hours
      d.setTime(now.getTime() + 2 * 60 * 60 * 1000);
    }
    deadline = d;
    text = text.replace(todayRegex, '').trim();
  } else if (timeMatch) {
    // Only time was specified (e.g. "Meeting 3pm") -> assume today if in future, else tomorrow
    const d = new Date();
    d.setHours(targetHour, targetMinute, 0, 0);
    if (d.getTime() <= now.getTime()) {
      d.setDate(d.getDate() + 1);
    }
    deadline = d;
  }

  // Clean extra spaces
  const cleanTitle = text.replace(/\s+/g, ' ').trim();

  return {
    title: cleanTitle,
    priority,
    category,
    deadline,
    tags,
  };
};
