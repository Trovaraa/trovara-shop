import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import HiringBanner from './HiringBanner.vue'
import ShopFooter from './ShopFooter.vue'

describe('shop public links', () => {
  it('links the hiring ticker to the public Trovara careers page', () => {
    const wrapper = mount(HiringBanner)
    const link = wrapper.get('a')

    expect(wrapper.text()).toContain('We’re hiring')
    expect(link.attributes('href')).toBe('https://www.trovara.farm/careers')
  })

  it('shows all official social profiles and a second careers link in the footer', () => {
    const wrapper = mount(ShopFooter, {
      global: {
        stubs: { TrovaraLogo: { template: '<span>Trovara Farm</span>' } },
      },
    })
    const links = wrapper.findAll('a')
    const hrefs = links.map((link) => link.attributes('href'))

    expect(wrapper.text()).toContain('Follow the farm')
    expect(hrefs).toContain('https://www.facebook.com/trovarafarm')
    expect(hrefs).toContain('https://www.instagram.com/trovara_farm/')
    expect(hrefs).toContain('https://www.tiktok.com/@trovarafarm')
    expect(hrefs).toContain('https://www.linkedin.com/company/trovarafarm/')
    expect(hrefs).toContain('https://www.trovara.farm/careers')
  })
})
