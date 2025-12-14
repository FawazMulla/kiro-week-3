/**
 * Tests for RedditAPI
 * Includes unit tests and property-based tests
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { RedditAPI } from './RedditAPI.js';

describe('RedditAPI', () => {
  describe('Unit Tests', () => {
    it('should create RedditAPI with default subreddits', () => {
      const api = new RedditAPI();
      expect(api.subreddits).toEqual(['IndianDankMemes', 'indiameme', 'SaimanSays']);
    });

    it('should create RedditAPI with custom subreddits', () => {
      const customSubs = ['memes', 'dankmemes'];
      const api = new RedditAPI(customSubs);
      expect(api.subreddits).toEqual(customSubs);
    });

    it('should calculate engagement score correctly', () => {
      const api = new RedditAPI();
      const score = 100;
      const comments = 50;
      const engagement = api.calculateEngagementScore(score, comments);
      expect(engagement).toBe(200); // 100 + (50 * 2)
    });

    it('should parse valid Reddit response', () => {
      const api = new RedditAPI();
      const mockResponse = {
        data: {
          children: [
            {
              kind: 't3',
              data: {
                title: 'Test Meme',
                score: 100,
                num_comments: 20,
                created_utc: 1609459200, // 2021-01-01
                permalink: '/r/test/comments/abc123/test_meme/',
                subreddit: 'test',
                thumbnail: 'https://example.com/thumb.jpg',
                author: 'testuser'
              }
            }
          ]
        }
      };

      const posts = api.parseRedditResponse(mockResponse, 'test');
      expect(posts).toHaveLength(1);
      expect(posts[0].title).toBe('Test Meme');
      expect(posts[0].score).toBe(100);
      expect(posts[0].comments).toBe(20);
    });

    it('should aggregate posts by date', () => {
      const api = new RedditAPI();
      const posts = [
        {
          title: 'Post 1',
          score: 100,
          comments: 10,
          created: new Date('2024-01-01T10:00:00Z'),
          url: 'https://reddit.com/1',
          subreddit: 'test',
          thumbnail: '',
          author: 'user1'
        },
        {
          title: 'Post 2',
          score: 200,
          comments: 20,
          created: new Date('2024-01-01T15:00:00Z'),
          url: 'https://reddit.com/2',
          subreddit: 'test',
          thumbnail: '',
          author: 'user2'
        },
        {
          title: 'Post 3',
          score: 150,
          comments: 15,
          created: new Date('2024-01-02T10:00:00Z'),
          url: 'https://reddit.com/3',
          subreddit: 'test',
          thumbnail: '',
          author: 'user3'
        }
      ];

      const dateMap = api.aggregateByDate(posts);
      expect(dateMap.size).toBe(2);
      expect(dateMap.get('2024-01-01').posts).toHaveLength(2);
      expect(dateMap.get('2024-01-01').totalScore).toBe(300);
      expect(dateMap.get('2024-01-01').totalComments).toBe(30);
      expect(dateMap.get('2024-01-02').posts).toHaveLength(1);
    });

    it('should calculate popularity from posts', () => {
      const api = new RedditAPI();
      const posts = [
        {
          title: 'Post 1',
          score: 100,
          comments: 10,
          created: new Date('2024-01-01T10:00:00Z'),
          url: 'https://reddit.com/1',
          subreddit: 'test',
          thumbnail: '',
          author: 'user1'
        }
      ];

      const popularity = api.calculateMemePopularity(posts);
      expect(popularity).toHaveLength(1);
      expect(popularity[0].posts).toBe(1);
      expect(popularity[0].popularity).toBe(120); // 100 + (10 * 2)
    });

    it('should return empty array for empty posts', () => {
      const api = new RedditAPI();
      const popularity = api.calculateMemePopularity([]);
      expect(popularity).toEqual([]);
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Feature: meme-market-dashboard, Property 3: Popularity score monotonicity
     * Validates: Requirements 5.4
     * 
     * For any two sets of meme posts where set A has strictly higher engagement 
     * (score + comments) than set B on every date, the popularity scores for 
     * set A should be greater than or equal to set B for corresponding dates.
     */
    it('should maintain popularity score monotonicity', () => {
      const api = new RedditAPI();

      // Generator for a meme post with specific date and engagement
      const memePostGen = (date, minScore, minComments) => fc.record({
        title: fc.string({ minLength: 1, maxLength: 100 }),
        score: fc.integer({ min: minScore, max: minScore + 1000 }),
        comments: fc.integer({ min: minComments, max: minComments + 500 }),
        created: fc.constant(date),
        url: fc.webUrl(),
        subreddit: fc.constantFrom('test1', 'test2', 'test3'),
        thumbnail: fc.option(fc.webUrl(), { nil: '' }),
        author: fc.string({ minLength: 1, maxLength: 20 })
      });

      // Generator for a set of posts on the same date
      const postsForDateGen = (date, minScore, minComments, count) => 
        fc.array(memePostGen(date, minScore, minComments), { 
          minLength: count, 
          maxLength: count 
        });

      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // number of dates
          fc.integer({ min: 1, max: 5 }),  // posts per date
          fc.integer({ min: 10, max: 100 }), // base score for set B
          fc.integer({ min: 5, max: 50 }),   // base comments for set B
          fc.integer({ min: 100, max: 500 }), // engagement boost
          (numDates, postsPerDate, baseScore, baseComments, engagementBoost) => {
            // Generate dates
            const dates = Array.from({ length: numDates }, (_, i) => {
              const date = new Date('2024-01-01');
              date.setDate(date.getDate() + i);
              return date;
            });

            // Generate set B (lower engagement)
            const postsB = dates.flatMap(date => 
              fc.sample(postsForDateGen(date, baseScore, baseComments, postsPerDate), 1)[0]
            );

            // Generate set A (higher engagement) - ensure strictly higher
            // For each post in B, we need to ensure A has higher engagement
            // Max possible engagement for B post: (baseScore + 1000) + ((baseComments + 500) * 2)
            // = baseScore + 1000 + baseComments * 2 + 1000 = baseScore + baseComments * 2 + 2000
            // So we need A's min to be higher than B's max
            const maxBEngagement = (baseScore + 1000) + ((baseComments + 500) * 2);
            const minAScore = maxBEngagement + engagementBoost;
            const minAComments = 0; // Start from 0 since score is already boosted enough
            
            const postsA = dates.flatMap(date => 
              fc.sample(postsForDateGen(date, minAScore, minAComments, postsPerDate), 1)[0]
            );

            // Calculate popularity for both sets
            const popularityA = api.calculateMemePopularity(postsA);
            const popularityB = api.calculateMemePopularity(postsB);

            // Both should have same number of dates
            expect(popularityA.length).toBe(popularityB.length);

            // For each corresponding date, A's popularity should be >= B's
            for (let i = 0; i < popularityA.length; i++) {
              const dateA = popularityA[i].date.toISOString().split('T')[0];
              const dateB = popularityB[i].date.toISOString().split('T')[0];
              
              // Dates should match
              expect(dateA).toBe(dateB);
              
              // Popularity A should be greater than or equal to B
              // Since every post in A has strictly higher engagement than any post in B,
              // and we have the same number of posts per date, A's total should be higher
              expect(popularityA[i].popularity).toBeGreaterThanOrEqual(popularityB[i].popularity);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
