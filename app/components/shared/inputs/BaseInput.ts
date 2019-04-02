import Vue from 'vue';
import cloneDeep from 'lodash/cloneDeep';
import uuid from 'uuid/v4';
import { IInputMetadata } from './index';
import ValidatedForm from './ValidatedForm.vue';
import TsxComponent from 'components/tsx-component';

export abstract class BaseInput<
  TValueType,
  TMetadataType extends IInputMetadata
> extends TsxComponent<{
  metadata: TMetadataType;
  value?: TValueType;
  title?: string;
  onInput?: Function;
}> {
  abstract readonly value: TValueType;
  abstract readonly title: string;
  abstract readonly metadata: TMetadataType;
  readonly onInput?: Function;

  /**
   * true if the component listens and re-emits child-inputs events
   */
  delegateChildrenEvents = true;

  /**
   * uuid serves to link input field and validator message
   */
  readonly uuid = this.options.uuid || uuid();

  /**
   * contains ValidatedForm if exist
   */
  protected form: ValidatedForm = null;

  /**
   * contains parent-input if exist
   */
  protected parentInput: BaseInput<any, any> = null;

  constructor() {
    super();

    // try to find parent-form and parent-input
    // tslint:disable-next-line:no-this-assignment TODO
    let comp: Vue = this;
    do {
      comp = comp.$parent;
      if (!this.parentInput && comp instanceof BaseInput) {
        this.parentInput = comp;
      }
    } while (comp && !(comp instanceof ValidatedForm));

    if (!comp) return;
    this.form = comp as ValidatedForm;

    // Vue doesn't like when optional methods are undefined
    if (!this.onInput) this.onInput = null;
  }

  emitInput(eventData: TValueType, event?: any) {
    this.$emit('input', eventData, event);

    if (this.onInput) this.onInput(eventData);

    const needToSendEventToForm =
      (this.form && !this.parentInput) ||
      (this.parentInput && !this.parentInput.delegateChildrenEvents);

    if (needToSendEventToForm) this.form.emitInput(eventData, event);
  }

  getValidations() {
    return { required: this.options.required };
  }

  /**
   * object for vee validate plugin
   */
  get validate() {
    const validations = this.getValidations();
    Object.keys(validations).forEach(key => {
      // VeeValidate recognizes undefined values as valid constraints
      // so just remove it
      if (validations[key] === void 0) delete validations[key];
    });

    return validations;
  }

  getOptions(): TMetadataType {
    // merge props and metadata to the 'options' object
    // override this method if you need add more props to the 'option' object
    const metadata = this.metadata || ({} as TMetadataType);
    const options = cloneDeep(metadata);
    options.title = this.title || metadata.title;
    return options;
  }

  get options(): TMetadataType {
    return this.getOptions();
  }
}
