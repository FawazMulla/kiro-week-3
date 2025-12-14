import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemePanel } from './MemePanel.js';

describe('MemePanel', () => {
  let container;
  let panel;

  beforeEach(() => {
    // Create a container element
    container = document.createElement('div');
    container.id = 'test-meme-panel';
    document.body.appendChild(container);

    panel = new MemePanel('test-meme-panel');
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('constructor', () => {
    it('should create a MemePanel instance with containerId', () => {
      expect(panel.containerId).toBe('test-meme-panel');
      expect(panel.container).toBeNull();
    });
  });

  describe('render', () => {
    it('should handle missing container gracefully', () => {
      const invalidPanel = new MemePanel('non-existent-id');
      // Should not throw an error, should handle gracefully
      expect(() => invalidPanel.render([])).not.toThrow();
    });

    it('should render empty state when no memes provided', () => {
      panel.render([]);
      expect(container.innerHTML).toContain('No meme data available');
      expect(container.innerHTML).toContain('Trending Memes');
    });

    it('should render empty state when memes is null', () => {
      panel.render(null);
      expect(container.innerHTML).toContain('No meme data available');
    });

    it('should render top 5 memes sorted by engagement score', () => {
      const memes = [
        { title: 'Meme 1', score: 100, comments: 10, url: 'https://reddit.com/1', subreddit: 'india', thumbnail: 'https://example.com/1.jpg' },
        { title: 'Meme 2', score: 200, comments: 20, url: 'https://reddit.com/2', subreddit: 'india', thumbnail: 'https://example.com/2.jpg' },
        { title: 'Meme 3', score: 50, comments: 5, url: 'https://reddit.com/3', subreddit: 'india', thumbnail: 'https://example.com/3.jpg' },
        { title: 'Meme 4', score: 300, comments: 30, url: 'https://reddit.com/4', subreddit: 'india', thumbnail: 'https://example.com/4.jpg' },
        { title: 'Meme 5', score: 150, comments: 15, url: 'https://reddit.com/5', subreddit: 'india', thumbnail: 'https://example.com/5.jpg' },
        { title: 'Meme 6', score: 250, comments: 25, url: 'https://reddit.com/6', subreddit: 'india', thumbnail: 'https://example.com/6.jpg' },
      ];

      panel.render(memes);

      // Should show top 5 by engagement (score + comments * 2)
      // Meme 4: 300 + 60 = 360
      // Meme 6: 250 + 50 = 300
      // Meme 2: 200 + 40 = 240
      // Meme 5: 150 + 30 = 180
      // Meme 1: 100 + 20 = 120
      // Meme 3: 50 + 10 = 60 (should not appear)

      expect(container.innerHTML).toContain('Meme 4');
      expect(container.innerHTML).toContain('Meme 6');
      expect(container.innerHTML).toContain('Meme 2');
      expect(container.innerHTML).toContain('Meme 5');
      expect(container.innerHTML).toContain('Meme 1');
      expect(container.innerHTML).not.toContain('Meme 3');
    });

    it('should display total number of memes analyzed', () => {
      const memes = [
        { title: 'Meme 1', score: 100, comments: 10, url: 'https://reddit.com/1', subreddit: 'india', thumbnail: 'https://example.com/1.jpg' },
        { title: 'Meme 2', score: 200, comments: 20, url: 'https://reddit.com/2', subreddit: 'india', thumbnail: 'https://example.com/2.jpg' },
        { title: 'Meme 3', score: 50, comments: 5, url: 'https://reddit.com/3', subreddit: 'india', thumbnail: 'https://example.com/3.jpg' },
      ];

      panel.render(memes);
      expect(container.innerHTML).toContain('3 analyzed');
    });

    it('should display post title, score, comment count, and subreddit for each meme', () => {
      const memes = [
        { 
          title: 'Test Meme Title', 
          score: 1500, 
          comments: 250, 
          url: 'https://reddit.com/test', 
          subreddit: 'testsubreddit',
          thumbnail: 'https://example.com/test.jpg'
        }
      ];

      panel.render(memes);

      expect(container.innerHTML).toContain('Test Meme Title');
      expect(container.innerHTML).toContain('r/testsubreddit');
      expect(container.innerHTML).toContain('1.5K'); // score formatted
      expect(container.innerHTML).toContain('250'); // comments
    });

    it('should display thumbnail images when available', () => {
      const memes = [
        { 
          title: 'Meme with thumbnail', 
          score: 100, 
          comments: 10, 
          url: 'https://reddit.com/1', 
          subreddit: 'india',
          thumbnail: 'https://example.com/thumb.jpg'
        }
      ];

      panel.render(memes);
      expect(container.innerHTML).toContain('<img');
      expect(container.innerHTML).toContain('https://example.com/thumb.jpg');
    });

    it('should not display thumbnail for self posts', () => {
      const memes = [
        { 
          title: 'Self post', 
          score: 100, 
          comments: 10, 
          url: 'https://reddit.com/1', 
          subreddit: 'india',
          thumbnail: 'self'
        }
      ];

      panel.render(memes);
      expect(container.innerHTML).not.toContain('<img');
    });

    it('should not display thumbnail for default thumbnails', () => {
      const memes = [
        { 
          title: 'Default thumbnail', 
          score: 100, 
          comments: 10, 
          url: 'https://reddit.com/1', 
          subreddit: 'india',
          thumbnail: 'default'
        }
      ];

      panel.render(memes);
      expect(container.innerHTML).not.toContain('<img');
    });

    it('should escape HTML in meme titles to prevent XSS', () => {
      const memes = [
        { 
          title: '<script>alert("xss")</script>', 
          score: 100, 
          comments: 10, 
          url: 'https://reddit.com/1', 
          subreddit: 'india',
          thumbnail: 'https://example.com/1.jpg'
        }
      ];

      panel.render(memes);
      expect(container.innerHTML).not.toContain('<script>');
      expect(container.innerHTML).toContain('&lt;script&gt;');
    });

    it('should add click handler to open Reddit post in new tab', () => {
      const memes = [
        { 
          title: 'Clickable meme', 
          score: 100, 
          comments: 10, 
          url: 'https://reddit.com/test', 
          subreddit: 'india',
          thumbnail: 'https://example.com/1.jpg'
        }
      ];

      panel.render(memes);
      expect(container.innerHTML).toContain('window.open');
      expect(container.innerHTML).toContain('https://reddit.com/test');
      expect(container.innerHTML).toContain('_blank');
    });
  });

  describe('formatEngagement', () => {
    it('should calculate engagement as score + comments * 2', () => {
      expect(panel.formatEngagement(100, 50)).toBe('200');
      expect(panel.formatEngagement(500, 100)).toBe('700');
      expect(panel.formatEngagement(0, 0)).toBe('0');
    });

    it('should format large numbers with K suffix', () => {
      expect(panel.formatEngagement(1000, 0)).toBe('1.0K');
      expect(panel.formatEngagement(5000, 500)).toBe('6.0K');
    });

    it('should format very large numbers with M suffix', () => {
      expect(panel.formatEngagement(1000000, 0)).toBe('1.0M');
      expect(panel.formatEngagement(500000, 250000)).toBe('1.0M');
    });
  });

  describe('edge cases', () => {
    it('should handle memes with zero engagement', () => {
      const memes = [
        { title: 'Zero engagement', score: 0, comments: 0, url: 'https://reddit.com/1', subreddit: 'india', thumbnail: 'https://example.com/1.jpg' }
      ];

      panel.render(memes);
      expect(container.innerHTML).toContain('Zero engagement');
      expect(container.innerHTML).toContain('0'); // engagement score
    });

    it('should handle memes with missing thumbnail', () => {
      const memes = [
        { title: 'No thumbnail', score: 100, comments: 10, url: 'https://reddit.com/1', subreddit: 'india' }
      ];

      panel.render(memes);
      expect(container.innerHTML).toContain('No thumbnail');
      expect(container.innerHTML).not.toContain('<img');
    });

    it('should handle exactly 5 memes', () => {
      const memes = Array.from({ length: 5 }, (_, i) => ({
        title: `Meme ${i}`,
        score: 100,
        comments: 10,
        url: `https://reddit.com/${i}`,
        subreddit: 'india',
        thumbnail: `https://example.com/${i}.jpg`
      }));

      panel.render(memes);
      
      // All 5 should be displayed
      for (let i = 0; i < 5; i++) {
        expect(container.innerHTML).toContain(`Meme ${i}`);
      }
    });

    it('should handle less than 5 memes', () => {
      const memes = [
        { title: 'Meme 1', score: 100, comments: 10, url: 'https://reddit.com/1', subreddit: 'india', thumbnail: 'https://example.com/1.jpg' },
        { title: 'Meme 2', score: 200, comments: 20, url: 'https://reddit.com/2', subreddit: 'india', thumbnail: 'https://example.com/2.jpg' }
      ];

      panel.render(memes);
      expect(container.innerHTML).toContain('Meme 1');
      expect(container.innerHTML).toContain('Meme 2');
      expect(container.innerHTML).toContain('2 analyzed');
    });

    it('should handle very long meme titles', () => {
      const longTitle = 'A'.repeat(200);
      const memes = [
        { title: longTitle, score: 100, comments: 10, url: 'https://reddit.com/1', subreddit: 'india', thumbnail: 'https://example.com/1.jpg' }
      ];

      panel.render(memes);
      expect(container.innerHTML).toContain(longTitle);
    });
  });
});
